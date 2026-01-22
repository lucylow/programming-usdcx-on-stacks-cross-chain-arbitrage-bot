;; ============================================
;; contracts/dao-governance.clar
;; Complete DAO with proposal system, voting, and treasury
;; ============================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant GOVERNANCE_TOKEN (as-contract tx-sender))
(define-constant PROPOSAL_THRESHOLD u1000000)
(define-constant VOTING_PERIOD u10080)
(define-constant QUORUM u30000000)
(define-constant EXECUTION_DELAY u144)

;; Data structures
(define-data-var total-proposals uint u0)
(define-data-var dao-treasury uint u0)
(define-data-var is-paused bool false)

(define-map proposals
    {id: uint}
    {
        creator: principal,
        title: (string-ascii 100),
        description: (string-utf8 1000),
        for-votes: uint,
        against-votes: uint,
        abstain-votes: uint,
        created-at: uint,
        executed-at: (optional uint),
        state: (buff 1),
        target-contract: principal,
        function-name: (string-ascii 50),
        calldata: (list 20 (buff 100))
    }
)

(define-map votes
    {proposal-id: uint, voter: principal}
    {
        amount: uint,
        support: (buff 1),
        voted-at: uint
    }
)

(define-map user-locks
    {user: principal}
    {
        locked-until: uint,
        locked-amount: uint
    }
)

;; ================ PROPOSAL SYSTEM ================
(define-public (create-proposal
    (title (string-ascii 100))
    (description (string-utf8 1000))
    (target-contract principal)
    (function-name (string-ascii 50))
    (calldata (list 20 (buff 100)))
    )
    (let (
        (proposer-balance (unwrap! (contract-call? .governance-token get-voting-power tx-sender) (err u1100)))
        (proposal-id (+ (var-get total-proposals) u1))
    )
    (asserts! (not (var-get is-paused)) (err u1000))
    (asserts! (>= proposer-balance PROPOSAL_THRESHOLD) (err u1001))
    
    (map-set proposals
        {id: proposal-id}
        {
            creator: tx-sender,
            title: title,
            description: description,
            for-votes: u0,
            against-votes: u0,
            abstain-votes: u0,
            created-at: block-height,
            executed-at: none,
            state: 0x00,
            target-contract: target-contract,
            function-name: function-name,
            calldata: calldata
        }
    )
    
    (try! (contract-call? .governance-token lock-voting-tokens 
        tx-sender 
        proposal-id
        proposer-balance
    ))
    
    (var-set total-proposals proposal-id)
    (ok proposal-id)
    )
)

(define-public (activate-proposal (proposal-id uint))
    (let (
        (proposal (unwrap! (map-get? proposals {id: proposal-id}) (err u1050)))
    )
    (asserts! (is-eq (get state proposal) 0x00) (err u1051))
    (asserts! (is-eq tx-sender (get creator proposal)) (err u1052))
    
    (map-set proposals {id: proposal-id}
        (merge proposal {state: 0x01}))
    
    (ok true)
    )
)

(define-public (vote-on-proposal 
    (proposal-id uint) 
    (support (buff 1)) 
    (voting-power uint)
    )
    (let (
        (proposal (unwrap! (map-get? proposals {id: proposal-id}) (err u1002)))
        (current-block block-height)
        (vote-end (+ (get created-at proposal) VOTING_PERIOD))
    )
    (asserts! (is-eq (get state proposal) 0x01) (err u1002))
    (asserts! (< current-block vote-end) (err u1003))
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) 
        (err u1004))
    
    (try! (contract-call? .governance-token validate-voting-power
        tx-sender
        proposal-id
        voting-power
    ))
    
    (map-set votes
        {proposal-id: proposal-id, voter: tx-sender}
        {
            amount: voting-power,
            support: support,
            voted-at: current-block
        }
    )
    
    (if (is-eq support 0x01)
        (map-set proposals {id: proposal-id}
            (merge proposal {for-votes: (+ (get for-votes proposal) voting-power)}))
        (if (is-eq support 0x00)
            (map-set proposals {id: proposal-id}
                (merge proposal {against-votes: (+ (get against-votes proposal) voting-power)}))
            (map-set proposals {id: proposal-id}
                (merge proposal {abstain-votes: (+ (get abstain-votes proposal) voting-power)}))
        )
    )
    
    (ok true)
    )
)

;; ================ TREASURY MANAGEMENT ================
(define-public (deposit-to-treasury (amount uint))
    (begin
        (try! (contract-call? .governance-token transfer
            amount
            tx-sender
            (as-contract tx-sender)
        ))
        (var-set dao-treasury (+ (var-get dao-treasury) amount))
        (ok true)
    )
)

(define-public (execute-proposal (proposal-id uint))
    (let (
        (proposal (unwrap! (map-get? proposals {id: proposal-id}) (err u1005)))
        (current-block block-height)
        (vote-end (+ (get created-at proposal) VOTING_PERIOD))
        (total-votes (+ 
            (get for-votes proposal) 
            (get against-votes proposal)
            (get abstain-votes proposal)
        ))
    )
    (asserts! (is-eq (get state proposal) 0x01) (err u1005))
    (asserts! (> current-block (+ vote-end EXECUTION_DELAY)) (err u1006))
    (asserts! (>= total-votes QUORUM) (err u1007))
    (asserts! (> (get for-votes proposal) (get against-votes proposal)) (err u1008))
    
    (map-set proposals {id: proposal-id}
        (merge proposal {
            state: 0x02,
            executed-at: (some current-block)
        }))
    (ok true)
    )
)

;; ================ VIEW FUNCTIONS ================
(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals {id: proposal-id})
)

(define-read-only (get-proposal-state (proposal-id uint))
    (let ((proposal (unwrap! (map-get? proposals {id: proposal-id}) (err u1010))))
        (ok (get state proposal))
    )
)

(define-read-only (get-treasury-balance)
    (ok (var-get dao-treasury))
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
    (ok (is-some (map-get? votes {proposal-id: proposal-id, voter: voter})))
)

(define-read-only (get-total-proposals)
    (ok (var-get total-proposals))
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? votes {proposal-id: proposal-id, voter: voter})
)

;; ================ ADMIN FUNCTIONS ================
(define-public (emergency-pause)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) (err u1011))
        (var-set is-paused true)
        (ok true)
    )
)

(define-public (emergency-unpause)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) (err u1012))
        (var-set is-paused false)
        (ok true)
    )
)
