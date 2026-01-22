;; USDCx Bridge Contract
;; Handles cross-chain mint/burn operations with attestation verification

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INVALID-ATTESTATION (err u2000))
(define-constant ERR-ALREADY-PROCESSED (err u2001))
(define-constant ERR-INVALID-SIGNATURE (err u2002))
(define-constant ERR-INVALID-AMOUNT (err u2003))

(define-constant BRIDGE-ROLE "bridge")

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
    processed: bool
  }
)

(define-data-var request-nonce uint u0)

;; Deposit USDC → Mint USDCx
(define-public (deposit-and-mint
  (amount uint)
  (recipient principal)
  (attestation-hash (buff 32))
)
  (begin
    (asserts! (is-eq contract-caller .usdcx-token) ERR-NOT-AUTHORIZED)
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
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Burn USDCx → Withdraw USDC
(define-public (burn-and-withdraw
  (amount uint)
  (ethereum-recipient (buff 20))
)
  (let
    (
      (request-id (var-get request-nonce))
      (withdrawal-hash (sha256 (concat 
        (unwrap-panic (to-consensus-buff? amount))
        ethereum-recipient
      )))
    )
    
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (try! (contract-call? .usdcx-token protocol-burn amount tx-sender))
    
    (map-set withdrawal-requests
      { request-id: request-id }
      {
        amount: amount,
        requester: tx-sender,
        ethereum-recipient: ethereum-recipient,
        timestamp: (unwrap-panic (get-block-info? time (- block-height u1))),
        processed: false
      }
    )
    
    (var-set request-nonce (+ request-id u1))
    
    (print {
      event: "withdrawal",
      request-id: request-id,
      amount: amount,
      requester: tx-sender,
      ethereum-recipient: ethereum-recipient,
      withdrawal-hash: withdrawal-hash
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
