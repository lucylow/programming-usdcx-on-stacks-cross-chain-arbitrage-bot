;; ============================================
;; contracts/nft-marketplace.clar
;; Complete NFT marketplace with auctions, offers, royalties
;; ============================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant PLATFORM_FEE_PERCENT u250)
(define-constant MAX_ROYALTY_PERCENT u1000)
(define-constant MIN_AUCTION_DURATION u144)

(define-non-fungible-token nft-collection uint)

;; Data structures
(define-data-var total-listings uint u0)
(define-data-var total-auctions uint u0)
(define-data-var total-nfts-minted uint u0)
(define-data-var platform-fee-balance uint u0)
(define-data-var is-active bool true)

(define-map listings
    {listing-id: uint}
    {
        nft-id: uint,
        seller: principal,
        price: uint,
        listed-at: uint,
        status: (buff 1)
    }
)

(define-map auctions
    {auction-id: uint}
    {
        nft-id: uint,
        seller: principal,
        start-price: uint,
        reserve-price: uint,
        highest-bid: uint,
        highest-bidder: (optional principal),
        start-block: uint,
        end-block: uint,
        royalty-recipient: principal,
        royalty-percent: uint
    }
)

(define-map bids
    {auction-id: uint, bidder: principal}
    {amount: uint, bid-at: uint}
)

(define-map offers
    {nft-id: uint, offerer: principal}
    {amount: uint, offered-at: uint, expires-at: uint}
)

(define-map royalties
    {nft-id: uint}
    {recipient: principal, percentage: uint}
)

(define-map nft-metadata
    {nft-id: uint}
    {
        name: (string-ascii 100),
        uri: (string-ascii 256),
        creator: principal,
        created-at: uint
    }
)

;; ================ NFT MINTING ================
(define-public (mint-nft 
    (name (string-ascii 100))
    (uri (string-ascii 256))
    (royalty-percent uint)
    )
    (let (
        (nft-id (+ (var-get total-nfts-minted) u1))
    )
    (asserts! (var-get is-active) (err u3000))
    (asserts! (<= royalty-percent MAX_ROYALTY_PERCENT) (err u3001))
    
    (try! (nft-mint? nft-collection nft-id tx-sender))
    
    (map-set nft-metadata {nft-id: nft-id}
        {
            name: name,
            uri: uri,
            creator: tx-sender,
            created-at: block-height
        })
    
    (map-set royalties {nft-id: nft-id}
        {recipient: tx-sender, percentage: royalty-percent})
    
    (var-set total-nfts-minted nft-id)
    (ok nft-id)
    )
)

;; ================ LISTING MANAGEMENT ================
(define-public (list-nft 
    (nft-id uint) 
    (price uint)
    )
    (let (
        (nft-owner (unwrap! (nft-get-owner? nft-collection nft-id) (err u3002)))
        (listing-id (+ (var-get total-listings) u1))
    )
    (asserts! (is-eq tx-sender nft-owner) (err u3003))
    (asserts! (var-get is-active) (err u3004))
    (asserts! (> price u0) (err u3005))
    
    (map-set listings {listing-id: listing-id}
        {
            nft-id: nft-id,
            seller: tx-sender,
            price: price,
            listed-at: block-height,
            status: 0x00
        })
    
    (var-set total-listings listing-id)
    (ok listing-id)
    )
)

(define-public (cancel-listing (listing-id uint))
    (let (
        (listing (unwrap! (map-get? listings {listing-id: listing-id}) (err u3006)))
    )
    (asserts! (is-eq tx-sender (get seller listing)) (err u3007))
    (asserts! (is-eq (get status listing) 0x00) (err u3008))
    
    (map-set listings {listing-id: listing-id}
        (merge listing {status: 0x02}))
    
    (ok true)
    )
)

(define-public (buy-nft (listing-id uint))
    (let (
        (listing (unwrap! (map-get? listings {listing-id: listing-id}) (err u3009)))
        (nft-id (get nft-id listing))
        (seller (get seller listing))
        (price (get price listing))
        (platform-fee (/ (* price PLATFORM_FEE_PERCENT) u10000))
        (royalty-info (map-get? royalties {nft-id: nft-id}))
        (royalty-amount (match royalty-info
            info (/ (* price (get percentage info)) u10000)
            u0))
        (seller-amount (- price platform-fee royalty-amount))
    )
    (asserts! (is-eq (get status listing) 0x00) (err u3010))
    (asserts! (not (is-eq tx-sender seller)) (err u3011))
    
    ;; Transfer STX to seller
    (try! (stx-transfer? seller-amount tx-sender seller))
    
    ;; Transfer royalties if applicable
    (match royalty-info
        info (if (> royalty-amount u0)
                (try! (stx-transfer? royalty-amount tx-sender (get recipient info)))
                true)
        true)
    
    ;; Transfer platform fee
    (try! (stx-transfer? platform-fee tx-sender CONTRACT_OWNER))
    
    ;; Transfer NFT
    (try! (nft-transfer? nft-collection nft-id seller tx-sender))
    
    ;; Update listing status
    (map-set listings {listing-id: listing-id}
        (merge listing {status: 0x01}))
    
    ;; Update platform fees
    (var-set platform-fee-balance (+ (var-get platform-fee-balance) platform-fee))
    
    (ok true)
    )
)

;; ================ AUCTION SYSTEM ================
(define-public (create-auction
    (nft-id uint)
    (start-price uint)
    (reserve-price uint)
    (duration uint)
    )
    (let (
        (nft-owner (unwrap! (nft-get-owner? nft-collection nft-id) (err u3012)))
        (auction-id (+ (var-get total-auctions) u1))
        (end-block (+ block-height (if (> duration MIN_AUCTION_DURATION) duration MIN_AUCTION_DURATION)))
        (royalty-info (default-to {recipient: tx-sender, percentage: u0} 
            (map-get? royalties {nft-id: nft-id})))
    )
    (asserts! (is-eq tx-sender nft-owner) (err u3013))
    (asserts! (>= reserve-price start-price) (err u3014))
    (asserts! (var-get is-active) (err u3015))
    
    (map-set auctions {auction-id: auction-id}
        {
            nft-id: nft-id,
            seller: tx-sender,
            start-price: start-price,
            reserve-price: reserve-price,
            highest-bid: u0,
            highest-bidder: none,
            start-block: block-height,
            end-block: end-block,
            royalty-recipient: (get recipient royalty-info),
            royalty-percent: (get percentage royalty-info)
        })
    
    ;; Transfer NFT to contract escrow
    (try! (nft-transfer? nft-collection nft-id tx-sender (as-contract tx-sender)))
    
    (var-set total-auctions auction-id)
    (ok auction-id)
    )
)

(define-public (place-bid (auction-id uint) (bid-amount uint))
    (let (
        (auction (unwrap! (map-get? auctions {auction-id: auction-id}) (err u3016)))
        (current-highest (get highest-bid auction))
        (min-bid (if (> current-highest u0) 
                   (+ current-highest (/ current-highest u10))
                   (get start-price auction)))
    )
    (asserts! (> (get end-block auction) block-height) (err u3017))
    (asserts! (>= bid-amount min-bid) (err u3018))
    (asserts! (not (is-eq tx-sender (get seller auction))) (err u3019))
    
    ;; Refund previous highest bidder if exists
    (match (get highest-bidder auction)
        previous-bidder (try! (as-contract (stx-transfer? current-highest tx-sender previous-bidder)))
        true
    )
    
    ;; Transfer new bid to escrow
    (try! (stx-transfer? bid-amount tx-sender (as-contract tx-sender)))
    
    ;; Update auction
    (map-set auctions {auction-id: auction-id}
        (merge auction {
            highest-bid: bid-amount,
            highest-bidder: (some tx-sender)
        }))
    
    ;; Record bid
    (map-set bids {auction-id: auction-id, bidder: tx-sender}
        {amount: bid-amount, bid-at: block-height})
    
    (ok true)
    )
)

(define-public (settle-auction (auction-id uint))
    (let (
        (auction (unwrap! (map-get? auctions {auction-id: auction-id}) (err u3020)))
        (highest-bid (get highest-bid auction))
        (reserve-price (get reserve-price auction))
        (platform-fee (/ (* highest-bid PLATFORM_FEE_PERCENT) u10000))
        (royalty-amount (/ (* highest-bid (get royalty-percent auction)) u10000))
        (seller-amount (- highest-bid platform-fee royalty-amount))
    )
    (asserts! (<= (get end-block auction) block-height) (err u3021))
    (asserts! (is-some (get highest-bidder auction)) (err u3022))
    (asserts! (>= highest-bid reserve-price) (err u3023))
    
    (let ((winner (unwrap! (get highest-bidder auction) (err u3024))))
        ;; Pay seller
        (try! (as-contract (stx-transfer? seller-amount tx-sender (get seller auction))))
        
        ;; Pay royalties
        (if (> royalty-amount u0)
            (try! (as-contract (stx-transfer? royalty-amount tx-sender (get royalty-recipient auction))))
            true)
        
        ;; Transfer NFT to winner
        (try! (as-contract (nft-transfer? nft-collection 
            (get nft-id auction) 
            tx-sender 
            winner)))
        
        ;; Update platform fees
        (var-set platform-fee-balance (+ (var-get platform-fee-balance) platform-fee))
        
        (ok true)
    )
    )
)

(define-public (cancel-auction (auction-id uint))
    (let (
        (auction (unwrap! (map-get? auctions {auction-id: auction-id}) (err u3025)))
    )
    (asserts! (is-eq tx-sender (get seller auction)) (err u3026))
    (asserts! (is-none (get highest-bidder auction)) (err u3027))
    
    ;; Return NFT to seller
    (try! (as-contract (nft-transfer? nft-collection 
        (get nft-id auction) 
        tx-sender 
        (get seller auction))))
    
    (ok true)
    )
)

;; ================ OFFER SYSTEM ================
(define-public (make-offer 
    (nft-id uint) 
    (amount uint)
    (expiry-blocks uint)
    )
    (let (
        (current-owner (unwrap! (nft-get-owner? nft-collection nft-id) (err u3028)))
        (offer-expiry (+ block-height expiry-blocks))
    )
    (asserts! (not (is-eq tx-sender current-owner)) (err u3029))
    (asserts! (> expiry-blocks u10) (err u3030))
    (asserts! (> amount u0) (err u3031))
    
    ;; Lock offer amount in escrow
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    (map-set offers {nft-id: nft-id, offerer: tx-sender}
        {amount: amount, offered-at: block-height, expires-at: offer-expiry})
    
    (ok true)
    )
)

(define-public (accept-offer (nft-id uint) (offerer principal))
    (let (
        (offer (unwrap! (map-get? offers {nft-id: nft-id, offerer: offerer}) (err u3032)))
        (nft-owner (unwrap! (nft-get-owner? nft-collection nft-id) (err u3033)))
        (platform-fee (/ (* (get amount offer) PLATFORM_FEE_PERCENT) u10000))
        (royalty-info (map-get? royalties {nft-id: nft-id}))
        (royalty-amount (match royalty-info
            info (/ (* (get amount offer) (get percentage info)) u10000)
            u0))
        (seller-amount (- (get amount offer) platform-fee royalty-amount))
    )
    (asserts! (is-eq tx-sender nft-owner) (err u3034))
    (asserts! (> (get expires-at offer) block-height) (err u3035))
    
    ;; Transfer payment from escrow to seller
    (try! (as-contract (stx-transfer? seller-amount tx-sender nft-owner)))
    
    ;; Transfer royalties
    (match royalty-info
        info (if (> royalty-amount u0)
                (try! (as-contract (stx-transfer? royalty-amount tx-sender (get recipient info))))
                true)
        true)
    
    ;; Transfer NFT to offerer
    (try! (nft-transfer? nft-collection nft-id tx-sender offerer))
    
    ;; Remove offer
    (map-delete offers {nft-id: nft-id, offerer: offerer})
    
    (var-set platform-fee-balance (+ (var-get platform-fee-balance) platform-fee))
    
    (ok true)
    )
)

(define-public (cancel-offer (nft-id uint))
    (let (
        (offer (unwrap! (map-get? offers {nft-id: nft-id, offerer: tx-sender}) (err u3036)))
    )
    ;; Refund offer amount from escrow
    (try! (as-contract (stx-transfer? (get amount offer) tx-sender tx-sender)))
    
    (map-delete offers {nft-id: nft-id, offerer: tx-sender})
    
    (ok true)
    )
)

;; ================ VIEW FUNCTIONS ================
(define-read-only (get-listing (listing-id uint))
    (map-get? listings {listing-id: listing-id})
)

(define-read-only (get-auction (auction-id uint))
    (map-get? auctions {auction-id: auction-id})
)

(define-read-only (get-offer (nft-id uint) (offerer principal))
    (map-get? offers {nft-id: nft-id, offerer: offerer})
)

(define-read-only (get-nft-metadata (nft-id uint))
    (map-get? nft-metadata {nft-id: nft-id})
)

(define-read-only (get-nft-owner (nft-id uint))
    (nft-get-owner? nft-collection nft-id)
)

(define-read-only (get-royalty-info (nft-id uint))
    (map-get? royalties {nft-id: nft-id})
)

(define-read-only (get-platform-fees)
    (ok (var-get platform-fee-balance))
)

(define-read-only (get-total-listings)
    (ok (var-get total-listings))
)

(define-read-only (get-total-auctions)
    (ok (var-get total-auctions))
)

(define-read-only (get-total-nfts)
    (ok (var-get total-nfts-minted))
)

;; ================ ADMIN FUNCTIONS ================
(define-public (withdraw-platform-fees (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u3037))
        (asserts! (>= (var-get platform-fee-balance) amount) (err u3038))
        
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        (var-set platform-fee-balance (- (var-get platform-fee-balance) amount))
        (ok true)
    )
)

(define-public (set-marketplace-active (active bool))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u3039))
        (var-set is-active active)
        (ok true)
    )
)
