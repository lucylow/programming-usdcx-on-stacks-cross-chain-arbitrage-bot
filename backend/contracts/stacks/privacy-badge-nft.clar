;; contracts/privacy-badge-nft.clar
;; SIP-009 compliant NFT for Cross-Chain Arbitrage Bot hackathon project
;; Awards "Privacy Badges" when users complete arbitrage operations

;; Implement the SIP-009 trait
(impl-trait .nft-trait.nft-trait)

;; --------------------------
;; Constants & errors
;; --------------------------

(define-constant ERR-UNAUTHORIZED (err u400))
(define-constant ERR-NOT-OWNER (err u401))
(define-constant ERR-NO-SUCH-TOKEN (err u402))
(define-constant ERR-ALREADY-CLAIMED (err u403))
(define-constant ERR-INVALID-URI (err u404))

;; Contract deployer can mint badges
(define-constant CONTRACT-OWNER tx-sender)

;; --------------------------
;; NFT definition & storage
;; --------------------------

;; Declare the NFT using uint token-ids
(define-non-fungible-token ARBITRAGE-BADGE uint)

;; Last token-id issued
(define-data-var last-id uint u0)

;; Total supply counter
(define-data-var total-supply uint u0)

;; Optional per-token URI
(define-map token-uri
  { token-id: uint }
  { uri: (string-ascii 256) }
)

;; Token metadata
(define-map token-metadata
  { token-id: uint }
  {
    minted-at: uint,
    badge-type: (string-ascii 32),
    trades-completed: uint,
    profit-earned: uint
  }
)

;; Track which addresses have claimed (for one-time claims)
(define-map has-claimed
  { address: principal }
  { claimed: bool }
)

;; Minter whitelist (DAO, mixer, arbitrage contracts can mint)
(define-map authorized-minters
  { minter: principal }
  { authorized: bool }
)

;; Base URI for metadata
(define-data-var base-uri (string-ascii 128) "https://api.arbitragebot.xyz/badges/")

;; --------------------------
;; Authorization helpers
;; --------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-authorized-minter (minter principal))
  (or 
    (is-eq minter CONTRACT-OWNER)
    (default-to false (get authorized (map-get? authorized-minters { minter: minter })))
  )
)

;; --------------------------
;; SIP-009 required functions
;; --------------------------

(define-read-only (get-last-token-id)
  (ok (var-get last-id))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? ARBITRAGE-BADGE token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (let
    (
      (entry (map-get? token-uri { token-id: token-id }))
    )
    (if (is-some entry)
      (ok (some (get uri (unwrap-panic entry))))
      (ok (some (concat (var-get base-uri) "default")))
    )
  )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    ;; Sender must sign and be the actual owner
    (asserts! (is-eq tx-sender sender) ERR-NOT-OWNER)
    (asserts! (is-eq (nft-get-owner? ARBITRAGE-BADGE token-id) (some sender)) ERR-NOT-OWNER)

    (try! (nft-transfer? ARBITRAGE-BADGE token-id sender recipient))
    (ok true)
  )
)

;; --------------------------
;; Extended read functions
;; --------------------------

(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata { token-id: token-id })
)

(define-read-only (has-user-claimed (user principal))
  (default-to false (get claimed (map-get? has-claimed { address: user })))
)

(define-read-only (get-balance (owner principal))
  (let ((balance u0))
    ;; Note: This is a simplified implementation
    ;; For production, maintain a separate balance map
    (ok balance)
  )
)

;; --------------------------
;; Minting logic
;; --------------------------

;; Mint with full metadata (for authorized minters like DAO/arbitrage contracts)
(define-public (mint-badge 
    (recipient principal) 
    (badge-type (string-ascii 32))
    (trades-completed uint)
    (profit-earned uint)
    (maybe-uri (optional (string-ascii 256))))
  (begin
    (asserts! (is-authorized-minter tx-sender) ERR-UNAUTHORIZED)

    (let ((next-id (+ (var-get last-id) u1)))
      (var-set last-id next-id)
      (var-set total-supply (+ (var-get total-supply) u1))

      ;; Mint NFT
      (try! (nft-mint? ARBITRAGE-BADGE next-id recipient))

      ;; Store metadata
      (map-set token-metadata 
        { token-id: next-id }
        {
          minted-at: block-height,
          badge-type: badge-type,
          trades-completed: trades-completed,
          profit-earned: profit-earned
        }
      )

      ;; Optionally store custom URI
      (match maybe-uri
        uri (map-set token-uri { token-id: next-id } { uri: uri })
        true
      )

      (ok next-id)
    )
  )
)

;; Public claim function (one per user)
(define-public (claim)
  (begin
    (asserts! (not (has-user-claimed tx-sender)) ERR-ALREADY-CLAIMED)
    
    (let ((next-id (+ (var-get last-id) u1)))
      (var-set last-id next-id)
      (var-set total-supply (+ (var-get total-supply) u1))

      ;; Mark as claimed
      (map-set has-claimed { address: tx-sender } { claimed: true })

      ;; Mint NFT
      (try! (nft-mint? ARBITRAGE-BADGE next-id tx-sender))

      ;; Store basic metadata
      (map-set token-metadata 
        { token-id: next-id }
        {
          minted-at: block-height,
          badge-type: "early-adopter",
          trades-completed: u0,
          profit-earned: u0
        }
      )

      (ok next-id)
    )
  )
)

;; Mint to specific user (owner only)
(define-public (mint-to (recipient principal) (maybe-uri (optional (string-ascii 256))))
  (begin
    (asserts! (is-authorized-minter tx-sender) ERR-UNAUTHORIZED)

    (let ((next-id (+ (var-get last-id) u1)))
      (var-set last-id next-id)
      (var-set total-supply (+ (var-get total-supply) u1))

      ;; Mint NFT
      (try! (nft-mint? ARBITRAGE-BADGE next-id recipient))

      ;; Store basic metadata
      (map-set token-metadata 
        { token-id: next-id }
        {
          minted-at: block-height,
          badge-type: "participant",
          trades-completed: u0,
          profit-earned: u0
        }
      )

      ;; Optionally store URI if provided
      (match maybe-uri
        uri (map-set token-uri { token-id: next-id } { uri: uri })
        true
      )

      (ok next-id)
    )
  )
)

;; --------------------------
;; Admin functions
;; --------------------------

(define-public (set-base-uri (new-uri (string-ascii 128)))
  (begin
    (asserts! (is-owner) ERR-UNAUTHORIZED)
    (var-set base-uri new-uri)
    (ok true)
  )
)

(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-owner) ERR-UNAUTHORIZED)
    (map-set authorized-minters { minter: minter } { authorized: true })
    (ok true)
  )
)

(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-owner) ERR-UNAUTHORIZED)
    (map-set authorized-minters { minter: minter } { authorized: false })
    (ok true)
  )
)

(define-public (set-token-uri (token-id uint) (new-uri (string-ascii 256)))
  (begin
    (asserts! (is-owner) ERR-UNAUTHORIZED)
    (asserts! (is-some (nft-get-owner? ARBITRAGE-BADGE token-id)) ERR-NO-SUCH-TOKEN)
    (map-set token-uri { token-id: token-id } { uri: new-uri })
    (ok true)
  )
)

;; --------------------------
;; Burn function
;; --------------------------

(define-public (burn (token-id uint))
  (let ((owner (unwrap! (nft-get-owner? ARBITRAGE-BADGE token-id) ERR-NO-SUCH-TOKEN)))
    (asserts! (is-eq tx-sender owner) ERR-NOT-OWNER)
    (try! (nft-burn? ARBITRAGE-BADGE token-id owner))
    (var-set total-supply (- (var-get total-supply) u1))
    (ok true)
  )
)
