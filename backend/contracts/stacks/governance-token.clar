;; ============================================
;; contracts/governance-token.clar
;; ERC-20-like token with voting power delegation
;; ============================================

(define-fungible-token governance-token)
(define-constant TOTAL_SUPPLY u1000000000)
(define-constant CONTRACT_OWNER tx-sender)

;; Data structures
(define-data-var total-supply-issued uint u0)
(define-data-var is-initialized bool false)

(define-map balances
    {owner: principal}
    {balance: uint, locked-until: uint}
)

(define-map allowances
    {owner: principal, spender: principal}
    uint
)

(define-map voting-power
    {owner: principal}
    uint
)

(define-map delegations
    {delegator: principal}
    {delegatee: principal, delegated-at: uint}
)

(define-map proposal-locks
    {owner: principal, proposal-id: uint}
    {locked-amount: uint, locked-at: uint}
)

;; ================ TOKEN FUNCTIONS ================
(define-public (initialize-token)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u2000))
        (asserts! (not (var-get is-initialized)) (err u2001))
        
        (try! (ft-mint? governance-token tx-sender TOTAL_SUPPLY))
        
        (map-set balances {owner: tx-sender}
            {balance: TOTAL_SUPPLY, locked-until: u0})
        
        (map-set voting-power {owner: tx-sender} TOTAL_SUPPLY)
        
        (var-set total-supply-issued TOTAL_SUPPLY)
        (var-set is-initialized true)
        (ok true)
    )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
    (let (
        (sender-balance (unwrap! (map-get? balances {owner: sender}) (err u2002)))
        (recipient-balance (default-to {balance: u0, locked-until: u0} 
            (map-get? balances {owner: recipient})))
        (current-block block-height)
    )
    (asserts! (is-eq tx-sender sender) (err u2003))
    (asserts! (>= (get balance sender-balance) amount) (err u2004))
    (asserts! (>= current-block (get locked-until sender-balance)) (err u2005))
    
    (map-set balances {owner: sender}
        {balance: (- (get balance sender-balance) amount), 
         locked-until: (get locked-until sender-balance)})
    
    (map-set balances {owner: recipient}
        {balance: (+ (get balance recipient-balance) amount),
         locked-until: (get locked-until recipient-balance)})
    
    (try! (ft-transfer? governance-token amount sender recipient))
    (ok true)
    )
)

(define-public (approve (spender principal) (amount uint))
    (begin
        (map-set allowances {owner: tx-sender, spender: spender} amount)
        (ok true)
    )
)

(define-public (transfer-from (amount uint) (owner principal) (recipient principal))
    (let (
        (current-allowance (default-to u0 (map-get? allowances {owner: owner, spender: tx-sender})))
        (owner-balance (unwrap! (map-get? balances {owner: owner}) (err u2006)))
        (recipient-balance (default-to {balance: u0, locked-until: u0} 
            (map-get? balances {owner: recipient})))
    )
    (asserts! (>= current-allowance amount) (err u2007))
    (asserts! (>= (get balance owner-balance) amount) (err u2008))
    
    (map-set allowances {owner: owner, spender: tx-sender} (- current-allowance amount))
    
    (map-set balances {owner: owner}
        {balance: (- (get balance owner-balance) amount),
         locked-until: (get locked-until owner-balance)})
    
    (map-set balances {owner: recipient}
        {balance: (+ (get balance recipient-balance) amount),
         locked-until: (get locked-until recipient-balance)})
    
    (try! (ft-transfer? governance-token amount owner recipient))
    (ok true)
    )
)

;; ================ VOTING SYSTEM ================
(define-public (delegate-votes (delegatee principal))
    (let (
        (delegator-balance (default-to {balance: u0, locked-until: u0} 
            (map-get? balances {owner: tx-sender})))
        (current-voting-power (default-to u0 (map-get? voting-power {owner: tx-sender})))
        (delegatee-voting-power (default-to u0 (map-get? voting-power {owner: delegatee})))
    )
    ;; Check for existing delegation and remove old voting power
    (match (map-get? delegations {delegator: tx-sender})
        existing-delegation 
            (let ((old-delegatee (get delegatee existing-delegation))
                  (old-delegatee-power (default-to u0 (map-get? voting-power {owner: old-delegatee}))))
                (map-set voting-power {owner: old-delegatee}
                    (if (>= old-delegatee-power current-voting-power)
                        (- old-delegatee-power current-voting-power)
                        u0))
            )
        true
    )
    
    ;; Set new delegation
    (map-set delegations {delegator: tx-sender}
        {delegatee: delegatee, delegated-at: block-height})
    
    ;; Update voting power for new delegatee
    (map-set voting-power {owner: delegatee}
        (+ delegatee-voting-power (get balance delegator-balance)))
    
    (ok true)
    )
)

(define-public (lock-voting-tokens (owner principal) (proposal-id uint) (amount uint))
    (let (
        (owner-balance (unwrap! (map-get? balances {owner: owner}) (err u2010)))
        (existing-lock (default-to {locked-amount: u0, locked-at: u0}
            (map-get? proposal-locks {owner: owner, proposal-id: proposal-id})))
    )
    (asserts! (>= (get balance owner-balance) (+ (get locked-amount existing-lock) amount)) (err u2012))
    
    (map-set proposal-locks {owner: owner, proposal-id: proposal-id}
        {locked-amount: (+ (get locked-amount existing-lock) amount), locked-at: block-height})
    
    (map-set balances {owner: owner}
        {balance: (get balance owner-balance),
         locked-until: (+ block-height u10080)})
    
    (ok true)
    )
)

(define-public (validate-voting-power (voter principal) (proposal-id uint) (claimed-power uint))
    (let (
        (actual-power (default-to u0 (map-get? voting-power {owner: voter})))
    )
    (asserts! (>= actual-power claimed-power) (err u2013))
    (ok true)
    )
)

(define-public (unlock-voting-tokens (proposal-id uint))
    (let (
        (lock-info (unwrap! (map-get? proposal-locks {owner: tx-sender, proposal-id: proposal-id}) (err u2014)))
        (owner-balance (unwrap! (map-get? balances {owner: tx-sender}) (err u2015)))
    )
    (map-delete proposal-locks {owner: tx-sender, proposal-id: proposal-id})
    
    (map-set balances {owner: tx-sender}
        {balance: (get balance owner-balance), locked-until: u0})
    
    (ok true)
    )
)

;; ================ VIEW FUNCTIONS ================
(define-read-only (get-balance (owner principal))
    (ok (default-to u0 (get balance (map-get? balances {owner: owner}))))
)

(define-read-only (get-voting-power (owner principal))
    (ok (default-to u0 (map-get? voting-power {owner: owner})))
)

(define-read-only (get-allowance (owner principal) (spender principal))
    (ok (default-to u0 (map-get? allowances {owner: owner, spender: spender})))
)

(define-read-only (total-supply)
    (ok (var-get total-supply-issued))
)

(define-read-only (get-delegation (delegator principal))
    (map-get? delegations {delegator: delegator})
)

(define-read-only (get-name)
    (ok "Governance Token")
)

(define-read-only (get-symbol)
    (ok "GOV")
)

(define-read-only (get-decimals)
    (ok u6)
)
