;; USDCx Staking Contract
;; Allows users to stake USDCx and earn rewards based on time-locked deposits
;; Implements flexible staking periods with different APY rates

(define-constant ERR-NOT-AUTHORIZED (err u3000))
(define-constant ERR-INVALID-AMOUNT (err u3001))
(define-constant ERR-INSUFFICIENT-BALANCE (err u3002))
(define-constant ERR-PROTOCOL-PAUSED (err u3003))
(define-constant ERR-INVALID-PRINCIPAL (err u3004))
(define-constant ERR-STAKE-NOT-FOUND (err u3005))
(define-constant ERR-STAKE-LOCKED (err u3006))
(define-constant ERR-INVALID-PERIOD (err u3007))
(define-constant ERR-INSUFFICIENT-REWARDS (err u3008))
(define-constant ERR-EARLY-UNSTAKE-PENALTY (err u3009))
(define-constant EARLY-UNSTAKE-PENALTY-BPS u1000) ;; 10% penalty for early unstake

;; Staking period types (in blocks, ~10 minutes per block)
(define-constant PERIOD-30-DAYS u4320)    ;; ~30 days
(define-constant PERIOD-90-DAYS u12960)  ;; ~90 days
(define-constant PERIOD-180-DAYS u25920) ;; ~180 days
(define-constant PERIOD-365-DAYS u52560) ;; ~365 days

;; APY rates (basis points: 500 = 5%, 1000 = 10%)
(define-constant APY-30-DAYS u500)   ;; 5% APY
(define-constant APY-90-DAYS u800)   ;; 8% APY
(define-constant APY-180-DAYS u1200) ;; 12% APY
(define-constant APY-365-DAYS u1500) ;; 15% APY

(define-constant GOVERNANCE-ROLE "governance")
(define-constant PAUSE-ROLE "pause")

;; Staking position data
(define-map stakes
  { staker: principal, stake-id: uint }
  {
    amount: uint,
    start-block: uint,
    period-blocks: uint,
    apy-bps: uint,
    claimed-rewards: uint,
    active: bool
  }
)

;; User stake counter (for unique stake IDs)
(define-map user-stake-count principal uint)

;; Total staked amount
(define-data-var total-staked uint u0)

;; Total rewards distributed
(define-data-var total-rewards-distributed uint u0)

;; Protocol state
(define-data-var protocol-paused bool false)
(define-data-var reward-pool uint u0)
(define-data-var governance principal tx-sender)

;; Role management
(define-map roles
  { role: (string-ascii 20), account: principal }
  { enabled: bool }
)

;; Initialize governance role
(map-set roles
  { role: GOVERNANCE-ROLE, account: tx-sender }
  { enabled: true }
)

(map-set roles
  { role: PAUSE-ROLE, account: tx-sender }
  { enabled: true }
)

;; Helper functions
(define-private (is-protocol-caller (role (string-ascii 20)) (caller principal))
  (default-to false
    (get enabled
      (map-get? roles { role: role, account: caller })
    )
  )
)

(define-private (check-not-paused)
  (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
)

(define-private (get-apy-for-period (period-blocks uint))
  (if (is-eq period-blocks PERIOD-30-DAYS)
    (ok APY-30-DAYS)
    (if (is-eq period-blocks PERIOD-90-DAYS)
      (ok APY-90-DAYS)
      (if (is-eq period-blocks PERIOD-180-DAYS)
        (ok APY-180-DAYS)
        (if (is-eq period-blocks PERIOD-365-DAYS)
          (ok APY-365-DAYS)
          (err ERR-INVALID-PERIOD)
        )
      )
    )
  )
)

(define-private (calculate-rewards
  (amount uint)
  (start-block uint)
  (period-blocks uint)
  (apy-bps uint)
  (current-block uint)
)
  (let
    (
      (blocks-staked (- current-block start-block))
      (blocks-in-period period-blocks)
    )
    (if (or (is-eq amount u0) (is-eq blocks-in-period u0))
      (ok u0)
      (let
        (
          (rewards-numerator (* amount apy-bps))
        )
        (if (>= blocks-staked blocks-in-period)
          ;; Full period completed, calculate full rewards
          (ok (/ rewards-numerator u10000))
          ;; Partial period, calculate proportional rewards (with overflow check)
          (if (> rewards-numerator u340282366920938463463374607431768211455)
            (err ERR-INSUFFICIENT-REWARDS)
            (ok (/ (* rewards-numerator blocks-staked) (* blocks-in-period u10000)))
          )
        )
      )
    )
  )
)

;; ==========================================
;; Public Functions
;; ==========================================

;; Stake USDCx tokens
(define-public (stake
  (amount uint)
  (period-blocks uint)
)
  (let
    (
      (staker tx-sender)
      (stake-id (default-to u0 (map-get? user-stake-count staker)))
      (new-stake-id (+ stake-id u1))
      (apy-result (try! (get-apy-for-period period-blocks)))
      (current-block block-height)
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      (asserts! (is-ok apy-result) ERR-INVALID-PERIOD)
      
      ;; Transfer USDCx from staker to contract
      (try! (contract-call? .usdcx-token transfer amount staker (as-contract tx-sender) none))
      
      ;; Create stake position
      (map-set stakes
        { staker: staker, stake-id: new-stake-id }
        {
          amount: amount,
          start-block: current-block,
          period-blocks: period-blocks,
          apy-bps: (unwrap apy-result),
          claimed-rewards: u0,
          active: true
        }
      )
      
      ;; Update counters
      (map-set user-stake-count staker new-stake-id)
      (var-set total-staked (+ (var-get total-staked) amount))
      
      (print {
        event: "stake-created",
        staker: staker,
        stake-id: new-stake-id,
        amount: amount,
        period-blocks: period-blocks,
        apy-bps: (unwrap apy-result)
      })
      
      (ok new-stake-id)
    )
  )
)

;; Unstake USDCx tokens (with early unstake penalty if before lock period)
(define-public (unstake (stake-id uint))
  (let
    (
      (staker tx-sender)
      (stake-data (unwrap-panic (map-get? stakes { staker: staker, stake-id: stake-id })))
      (amount (get amount stake-data))
      (start-block (get start-block stake-data))
      (period-blocks (get period-blocks stake-data))
      (current-block block-height)
      (blocks-elapsed (- current-block start-block))
      (is-early (< blocks-elapsed period-blocks))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (get active stake-data) ERR-STAKE-NOT-FOUND)
      
      ;; Calculate and claim final rewards
      (let
        (
          (apy-bps (get apy-bps stake-data))
          (total-rewards-result (try! (calculate-rewards amount start-block period-blocks apy-bps current-block)))
          (total-rewards (unwrap total-rewards-result))
          (unclaimed-rewards (- total-rewards (get claimed-rewards stake-data)))
          (penalty-amount (if is-early (/ (* amount EARLY-UNSTAKE-PENALTY-BPS) u10000) u0))
          (return-amount (- amount penalty-amount))
        )
        (begin
          ;; Apply early unstake penalty
          (if is-early
            (begin
              ;; Burn penalty amount
              (try! (contract-call? .usdcx-token protocol-burn penalty-amount (as-contract tx-sender)))
              (print { event: "early-unstake-penalty", staker: staker, stake-id: stake-id, penalty: penalty-amount })
            )
          )
          
          ;; Claim any remaining rewards (only if not early unstake)
          (if (and (not is-early) (> unclaimed-rewards u0))
            (try! (contract-call? .usdcx-token protocol-mint unclaimed-rewards staker))
          )
          
          ;; Return staked amount (minus penalty if early)
          (try! (contract-call? .usdcx-token transfer return-amount (as-contract tx-sender) staker none))
          
          ;; Mark stake as inactive
          (map-set stakes
            { staker: staker, stake-id: stake-id }
            {
              amount: amount,
              start-block: start-block,
              period-blocks: period-blocks,
              apy-bps: apy-bps,
              claimed-rewards: (if is-early (get claimed-rewards stake-data) total-rewards),
              active: false
            }
          )
          
          (var-set total-staked (- (var-get total-staked) amount))
          (if (not is-early)
            (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) unclaimed-rewards))
          )
          
          (print {
            event: "unstake",
            staker: staker,
            stake-id: stake-id,
            amount: return-amount,
            rewards: (if is-early u0 unclaimed-rewards),
            early-unstake: is-early,
            penalty: penalty-amount
          })
          
          (ok true)
        )
      )
    )
  )
)

;; Claim rewards without unstaking (for active stakes)
(define-public (claim-rewards (stake-id uint))
  (let
    (
      (staker tx-sender)
      (stake-data (unwrap-panic (map-get? stakes { staker: staker, stake-id: stake-id })))
      (amount (get amount stake-data))
      (start-block (get start-block stake-data))
      (period-blocks (get period-blocks stake-data))
      (apy-bps (get apy-bps stake-data))
      (current-block block-height)
      (total-rewards (calculate-rewards amount start-block period-blocks apy-bps current-block))
      (claimed-rewards (get claimed-rewards stake-data))
      (unclaimed-rewards (- total-rewards claimed-rewards))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (get active stake-data) ERR-STAKE-NOT-FOUND)
      (asserts! (> unclaimed-rewards u0) ERR-INSUFFICIENT-REWARDS)
      
      ;; Mint rewards to staker
      (try! (contract-call? .usdcx-token protocol-mint unclaimed-rewards staker))
      
      ;; Update claimed rewards
      (map-set stakes
        { staker: staker, stake-id: stake-id }
        {
          amount: amount,
          start-block: start-block,
          period-blocks: period-blocks,
          apy-bps: apy-bps,
          claimed-rewards: total-rewards,
          active: true
        }
      )
      
      (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) unclaimed-rewards))
      
      (print {
        event: "rewards-claimed",
        staker: staker,
        stake-id: stake-id,
        rewards: unclaimed-rewards
      })
      
      (ok unclaimed-rewards)
    )
  )
)

;; ==========================================
;; Read-Only Functions
;; ==========================================

(define-read-only (get-stake (staker principal) (stake-id uint))
  (ok (map-get? stakes { staker: staker, stake-id: stake-id }))
)

(define-read-only (get-stake-count (staker principal))
  (ok (default-to u0 (map-get? user-stake-count staker)))
)

(define-read-only (get-total-staked)
  (ok (var-get total-staked))
)

(define-read-only (get-total-rewards-distributed)
  (ok (var-get total-rewards-distributed))
)

(define-read-only (calculate-pending-rewards
  (staker principal)
  (stake-id uint)
)
  (match (map-get? stakes { staker: staker, stake-id: stake-id })
    stake-data (let
      (
        (amount (get amount stake-data))
        (start-block (get start-block stake-data))
        (period-blocks (get period-blocks stake-data))
        (apy-bps (get apy-bps stake-data))
        (current-block block-height)
        (total-rewards-result (calculate-rewards amount start-block period-blocks apy-bps current-block))
        (claimed-rewards (get claimed-rewards stake-data))
      )
      (match total-rewards-result
        total-rewards (ok (- total-rewards claimed-rewards))
        (ok u0)
      )
    )
    (ok u0)
  )
)

;; ==========================================
;; Governance Functions
;; ==========================================

(define-public (update-role
  (role (string-ascii 20))
  (account principal)
  (enabled bool)
)
  (begin
    (asserts! (is-protocol-caller GOVERNANCE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (map-set roles { role: role, account: account } { enabled: enabled })
    (print { event: "role-updated", role: role, account: account, enabled: enabled })
    (ok true)
  )
)

(define-public (protocol-pause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused true)
    (print { event: "protocol-paused" })
    (ok true)
  )
)

(define-public (protocol-unpause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused false)
    (print { event: "protocol-unpaused" })
    (ok true)
  )
)

(define-public (fund-reward-pool (amount uint))
  (begin
    (asserts! (is-protocol-caller GOVERNANCE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (try! (check-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Transfer USDCx to contract for rewards
    (try! (contract-call? .usdcx-token transfer amount tx-sender (as-contract tx-sender) none))
    
    (var-set reward-pool (+ (var-get reward-pool) amount))
    
    (print { event: "reward-pool-funded", amount: amount })
    (ok true)
  )
)

