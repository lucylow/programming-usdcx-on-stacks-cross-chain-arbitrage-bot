;; contracts/nft-trait.clar
;; SIP-009 NFT trait interface for Stacks

(define-trait nft-trait
  (
    ;; Get the last issued token ID
    (get-last-token-id () (response uint uint))

    ;; Get optional token URI metadata for a given token-id
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))

    ;; Get the owner (principal) of a given token-id
    (get-owner (uint) (response (optional principal) uint))

    ;; Transfer a token-id from sender to recipient
    (transfer (uint principal principal) (response bool uint))
  )
)
