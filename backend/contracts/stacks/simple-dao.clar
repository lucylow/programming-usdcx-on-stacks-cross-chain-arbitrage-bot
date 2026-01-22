;; contracts/simple-dao.clar
;; Minimal DAO governance core for Arbitrage Bot

;; --------------------------
;; Errors & constants
;; --------------------------

(define-constant ERR-NOT-MEMBER (err u100))
(define-constant ERR-ALREADY-MEMBER (err u101))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-VOTED (err u103))
(define-constant ERR-NOT-AUTHORIZED (err u104))
(define-constant ERR-PROPOSAL-ENDED (err u105))
(define-constant ERR-PROPOSAL-STILL-OPEN (err u106))
(define-constant ERR-PROPOSAL-ALREADY-EXECUTED (err u107))
(define-constant ERR-VOTING-CLOSED (err u108))

;; Quorum and threshold
(define-constant MIN_QUORUM u1)
(define-constant PASS_THRESHOLD_BPS u5000) ;; 50% in basis points

;; --------------------------
;; Data structures
;; --------------------------

;; DAO admin
(define-data-var dao-admin principal tx-sender)

;; Members with voting power
(define-map members
  { account: principal }
  { voting-power: uint }
)

;; Proposal structure
(define-map proposals
  { id: uint }
  {
    creator: principal,
    target: principal,
    function: (string-ascii 32),
    value: uint,
    yes-votes: uint,
    no-votes: uint,
    start-height: uint,
    end-height: uint,
    executed: bool
  }
)

;; Track votes
(define-map votes
  { proposal-id: uint, voter: principal }
  { support: bool, weight: uint }
)

(define-data-var proposal-counter uint u0)

;; --------------------------
;; Read-only helpers
;; --------------------------

(define-read-only (get-admin)
  (ok (var-get dao-admin))
)

(define-read-only (is-member (who principal))
  (ok (is-some (map-get? members { account: who })))
)

(define-read-only (get-member (who principal))
  (map-get? members { account: who })
)

(define-read-only (get-proposal (id uint))
  (map-get? proposals { id: id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (ok (map-get? votes { proposal-id: proposal-id, voter: voter }))
)

(define-read-only (get-proposal-count)
  (ok (var-get proposal-counter))
)

;; Check if proposal passed
(define-read-only (proposal-passed (proposal-id uint))
  (let
    ((proposal (map-get? proposals { id: proposal-id })))
    (if (is-none proposal)
      (ok false)
      (let
        ((p (unwrap-panic proposal)))
        (let
          (
            (yes (get yes-votes p))
            (no (get no-votes p))
            (total (+ yes no))
          )
          (ok (and
                (>= total MIN_QUORUM)
                (>= (* yes u10000) (* PASS_THRESHOLD_BPS total))
                (>= block-height (get end-height p))
              ))
        )
      )
    )
  )
)

;; --------------------------
;; Admin / membership
;; --------------------------

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-admin)) ERR-NOT-AUTHORIZED)
    (var-set dao-admin new-admin)
    (ok true)
  )
)

(define-public (add-member (who principal) (voting-power uint))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? members { account: who })) ERR-ALREADY-MEMBER)
    (map-set members { account: who } { voting-power: voting-power })
    (ok true)
  )
)

(define-public (update-member-power (who principal) (voting-power uint))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? members { account: who })) ERR-NOT-MEMBER)
    (map-set members { account: who } { voting-power: voting-power })
    (ok true)
  )
)

(define-public (remove-member (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? members { account: who })) ERR-NOT-MEMBER)
    (map-delete members { account: who })
    (ok true)
  )
)

;; --------------------------
;; Proposals
;; --------------------------

(define-public (create-proposal
  (target principal)
  (function (string-ascii 32))
  (value uint)
  (voting-period uint)
)
  (let
    (
      (member (map-get? members { account: tx-sender }))
    )
    (begin
      (asserts! (is-some member) ERR-NOT-MEMBER)
      (let
        (
          (id (+ (var-get proposal-counter) u1))
          (start block-height)
          (end (+ block-height voting-period))
        )
        (var-set proposal-counter id)
        (map-set proposals
          { id: id }
          {
            creator: tx-sender,
            target: target,
            function: function,
            value: value,
            yes-votes: u0,
            no-votes: u0,
            start-height: start,
            end-height: end,
            executed: false
          }
        )
        (ok id)
      )
    )
  )
)

;; --------------------------
;; Voting
;; --------------------------

(define-public (vote (proposal-id uint) (support bool))
  (let
    (
      (proposal (map-get? proposals { id: proposal-id }))
      (member (map-get? members { account: tx-sender }))
    )
    (begin
      (asserts! (is-some proposal) ERR-PROPOSAL-NOT-FOUND)
      (asserts! (is-some member) ERR-NOT-MEMBER)

      (let
        (
          (p (unwrap! proposal ERR-PROPOSAL-NOT-FOUND))
          (m (unwrap! member ERR-NOT-MEMBER))
        )
        (begin
          ;; Check voting window
          (asserts! (>= block-height (get start-height p)) ERR-VOTING-CLOSED)
          (asserts! (<= block-height (get end-height p)) ERR-PROPOSAL-ENDED)

          ;; Prevent double voting
          (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) ERR-ALREADY-VOTED)

          (let ((weight (get voting-power m)))
            ;; Record vote
            (map-set votes
              { proposal-id: proposal-id, voter: tx-sender }
              { support: support, weight: weight }
            )

            ;; Update tallies
            (if support
              (map-set proposals
                { id: proposal-id }
                (merge p { yes-votes: (+ (get yes-votes p) weight) })
              )
              (map-set proposals
                { id: proposal-id }
                (merge p { no-votes: (+ (get no-votes p) weight) })
              )
            )

            (ok true)
          )
        )
      )
    )
  )
)

;; --------------------------
;; Execution
;; --------------------------

(define-public (execute (proposal-id uint))
  (let
    ((proposal (map-get? proposals { id: proposal-id })))
    (begin
      (asserts! (is-some proposal) ERR-PROPOSAL-NOT-FOUND)
      (let ((p (unwrap! proposal ERR-PROPOSAL-NOT-FOUND)))
        (begin
          (asserts! (not (get executed p)) ERR-PROPOSAL-ALREADY-EXECUTED)
          (asserts! (>= block-height (get end-height p)) ERR-PROPOSAL-STILL-OPEN)
          (asserts! (unwrap! (proposal-passed proposal-id) ERR-PROPOSAL-NOT-FOUND) ERR-NOT-AUTHORIZED)

          ;; Mark proposal as executed
          (map-set proposals
            { id: proposal-id }
            (merge p { executed: true })
          )
          (ok true)
        )
      )
    )
  )
)
