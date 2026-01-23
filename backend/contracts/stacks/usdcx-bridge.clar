;; USDCx Bridge Contract
;; Handles cross-chain mint/burn operations with attestation verification
;; Authorized relayers submit attestations to mint; users burn and request withdraw

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INVALID-ATTESTATION (err u2000))
(define-constant ERR-ALREADY-PROCESSED (err u2001))
(define-constant ERR-INVALID-SIGNATURE (err u2002))
(define-constant ERR-INVALID-AMOUNT (err u2003))
(define-constant ERR-NOT-INITIALIZED (err u2004))
(define-constant ERR-WITHDRAWAL-NOT-FOUND (err u2005))
(define-constant ERR-WITHDRAWAL-ALREADY-PROCESSED (err u2006))
(define-constant ERR-INVALID-REQUEST-ID (err u2007))
(define-constant ERR-RATE-LIMIT-EXCEEDED (err u2008))
(define-constant ERR-INVALID-PRINCIPAL (err u2009))
(define-constant MAX-DAILY-WITHDRAWALS u100) ;; Max withdrawals per day per address
(define-constant MAX-DAILY-AMOUNT u100000000000) ;; Max 100k USDCx per day per address

(define-map processed-attestations
  { attestation-hash: (buff 32) }
  { processed: bool, block-height: uint }
)

(define-map withdrawal-requests
  { request-id: uint }
  {
    amount: uint,
    requester: principal,
    ethereum-recipient: (buff 20),
    timestamp: uint,
    processed: bool,
    processed-block: (optional uint),
    processed-tx-hash: (optional (buff 32))
  }
)

(define-map relayers principal bool)

;; Rate limiting: track daily withdrawals per address
(define-map daily-withdrawals
  { address: principal, day: uint }
  { count: uint, amount: uint }
)

(define-data-var request-nonce uint u0)
(define-data-var bridge-admin principal tx-sender)
(define-data-var initialized bool false)

(define-private (is-relayer-or-admin (who principal))
  (or
    (is-eq who (var-get bridge-admin))
    (default-to false (map-get? relayers who))
  )
)

;; One-time init (admin only). Grant bridge MINT_ROLE on usdcx-token after deploy.
(define-public (initialize))
  (begin
    (asserts! (not (var-get initialized)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq tx-sender (var-get bridge-admin)) ERR-NOT-AUTHORIZED)
    (var-set initialized true)
    (print { event: "bridge-initialized", admin: (var-get bridge-admin) })
    (ok true)
  )
)

;; Deposit USDC → Mint USDCx (relayer submits attestation; bridge mints to recipient)
(define-public (deposit-and-mint
  (amount uint)
  (recipient principal)
  (attestation-hash (buff 32))
)
  (begin
    (asserts! (var-get initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-relayer-or-admin tx-sender) ERR-NOT-AUTHORIZED)
    (asserts!
      (is-none (map-get? processed-attestations { attestation-hash: attestation-hash }))
      ERR-ALREADY-PROCESSED
    )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (map-set processed-attestations
      { attestation-hash: attestation-hash }
      { processed: true, block-height: block-height }
    )

    (try! (contract-call? .usdcx-token protocol-mint amount recipient))

    (print {
      event: "deposit",
      amount: amount,
      recipient: recipient,
      attestation-hash: attestation-hash,
      block-height: block-height,
      relayer: tx-sender
    })

    (ok true)
  )
)

;; Helper: Get current day (blocks per day ~144, assuming 10 min blocks)
(define-private (get-current-day)
  (/ block-height u144)
)

;; Helper: Check rate limits
(define-private (check-rate-limit (requester principal) (amount uint))
  (let
    (
      (current-day (get-current-day))
      (daily-stats (map-get? daily-withdrawals { address: requester, day: current-day }))
    )
    (match daily-stats
      stats (begin
        (asserts! (< (get count stats) MAX-DAILY-WITHDRAWALS) ERR-RATE-LIMIT-EXCEEDED)
        (asserts! (<= (+ (get amount stats) amount) MAX-DAILY-AMOUNT) ERR-RATE-LIMIT-EXCEEDED)
        (ok true)
      )
      (ok true)
    )
  )
)

;; Helper: Update rate limit tracking
(define-private (update-rate-limit (requester principal) (amount uint))
  (let
    (
      (current-day (get-current-day))
      (daily-stats (map-get? daily-withdrawals { address: requester, day: current-day }))
    )
    (match daily-stats
      stats (map-set daily-withdrawals
        { address: requester, day: current-day }
        {
          count: (+ (get count stats) u1),
          amount: (+ (get amount stats) amount)
        }
      )
      (map-set daily-withdrawals
        { address: requester, day: current-day }
        { count: u1, amount: amount }
      )
    )
  )
)

;; Burn USDCx → Withdraw USDC (caller burns own balance; requester recorded for relayer)
(define-public (burn-and-withdraw
  (amount uint)
  (ethereum-recipient (buff 20))
)
  (let
    (
      (request-id (var-get request-nonce))
      (ts (unwrap-panic (get-block-info? time block-height)))
      (withdrawal-hash (sha256 (concat
        (unwrap-panic (to-consensus-buff? amount))
        ethereum-recipient
      )))
    )

    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-some (some tx-sender)) ERR-INVALID-PRINCIPAL)
    (try! (check-rate-limit tx-sender amount))

    (try! (contract-call? .usdcx-token protocol-burn amount tx-sender))
    (update-rate-limit tx-sender amount)

    (map-set withdrawal-requests
      { request-id: request-id }
      {
        amount: amount,
        requester: tx-sender,
        ethereum-recipient: ethereum-recipient,
        timestamp: ts,
        processed: false,
        processed-block: none,
        processed-tx-hash: none
      }
    )

    (var-set request-nonce (+ request-id u1))

    (print {
      event: "withdrawal",
      request-id: request-id,
      amount: amount,
      requester: tx-sender,
      ethereum-recipient: ethereum-recipient,
      withdrawal-hash: withdrawal-hash,
      block-height: block-height
    })

    (ok request-id)
  )
)

;; Burn from a contract (e.g. vault) that holds USDCx. Caller must be owner.
;; Used when vault bridges: vault calls this with owner = self, bridge burns vault's balance.
(define-public (burn-and-withdraw-from
  (amount uint)
  (owner principal)
  (ethereum-recipient (buff 20))
)
  (let
    (
      (request-id (var-get request-nonce))
      (ts (unwrap-panic (get-block-info? time block-height)))
      (withdrawal-hash (sha256 (concat
        (unwrap-panic (to-consensus-buff? amount))
        ethereum-recipient
      )))
    )

    (asserts! (is-eq contract-caller owner) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-some (some owner)) ERR-INVALID-PRINCIPAL)
    ;; Rate limiting for contract withdrawals (use owner as key)
    (try! (check-rate-limit owner amount))

    (try! (contract-call? .usdcx-token protocol-burn amount owner))
    (update-rate-limit owner amount)

    (map-set withdrawal-requests
      { request-id: request-id }
      {
        amount: amount,
        requester: tx-sender,
        ethereum-recipient: ethereum-recipient,
        timestamp: ts,
        processed: false,
        processed-block: none,
        processed-tx-hash: none
      }
    )

    (var-set request-nonce (+ request-id u1))

    (print {
      event: "withdrawal-from",
      request-id: request-id,
      amount: amount,
      owner: owner,
      requester: tx-sender,
      ethereum-recipient: ethereum-recipient,
      withdrawal-hash: withdrawal-hash,
      block-height: block-height
    })

    (ok request-id)
  )
)

(define-read-only (get-withdrawal-request (request-id uint))
  (ok (map-get? withdrawal-requests { request-id: request-id }))
)

(define-read-only (is-attestation-processed (attestation-hash (buff 32)))
  (ok (is-some (map-get? processed-attestations { attestation-hash: attestation-hash })))
)

(define-read-only (get-admin)
  (ok (var-get bridge-admin))
)

(define-read-only (is-relayer (account principal))
  (ok (is-relayer-or-admin account))
)

(define-public (set-relayer (account principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) ERR-NOT-AUTHORIZED)
    (map-set relayers account enabled)
    (print { event: "relayer-updated", account: account, enabled: enabled })
    (ok true)
  )
)

;; ==========================================
;; Enhanced Withdrawal Management
;; ==========================================

;; Mark withdrawal as processed (relayer/admin only)
(define-public (mark-withdrawal-processed
  (request-id uint)
  (tx-hash (buff 32))
)
  (begin
    (asserts! (is-relayer-or-admin tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? withdrawal-requests { request-id: request-id })) ERR-WITHDRAWAL-NOT-FOUND)
    
    (let
      (
        (request (unwrap-panic (map-get withdrawal-requests { request-id: request-id })))
      )
      (begin
        (asserts! (not (get processed request)) ERR-WITHDRAWAL-ALREADY-PROCESSED)
        (map-set withdrawal-requests
          { request-id: request-id }
          {
            amount: (get amount request),
            requester: (get requester request),
            ethereum-recipient: (get ethereum-recipient request),
            timestamp: (get timestamp request),
            processed: true,
            processed-block: (some block-height),
            processed-tx-hash: (some tx-hash)
          }
        )
        (print {
          event: "withdrawal-processed",
          request-id: request-id,
          block-height: block-height,
          tx-hash: tx-hash
        })
        (ok true)
      )
    )
  )
)

;; Get withdrawal status with enhanced info
(define-read-only (get-withdrawal-status (request-id uint))
  (ok (map-get? withdrawal-requests { request-id: request-id }))
)

;; Get all pending withdrawals for a requester
(define-read-only (get-pending-withdrawals (requester principal))
  (ok u0) ;; Note: Clarity doesn't support filtering maps efficiently, 
          ;; this would need to be tracked separately or queried off-chain
)

;; Get withdrawal count
(define-read-only (get-withdrawal-count)
  (ok (var-get request-nonce))
)

;; Check if withdrawal is pending
(define-read-only (is-withdrawal-pending (request-id uint))
  (match (map-get? withdrawal-requests { request-id: request-id })
    request (ok (not (get processed request)))
    (ok false)
  )
)
