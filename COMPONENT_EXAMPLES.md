# Component Examples & Patterns

## Navigation Patterns

### Basic Navigation
\`\`\`tsx
import Navigation from "@/components/layout/Navigation"

export default function Layout({ children }) {
  return (
    <>
      <Navigation />
      <main className="pt-16">{children}</main>
    </>
  )
}
\`\`\`

### Navigation with Custom Items
\`\`\`tsx
const customNavItems = [
  {
    label: "Custom",
    href: "/custom",
    icon: CustomIcon,
    children: [
      {
        label: "Sub Item",
        href: "/custom/sub",
        icon: SubIcon,
        description: "Sub item description",
      },
    ],
  },
]

// Pass to Navigation component
<Navigation items={customNavItems} />
\`\`\`

## Command Palette Patterns

### Opening Programmatically
\`\`\`tsx
function MyComponent() {
  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    )
  }

  return (
    <button onClick={openCommandPalette}>
      Open Commands
    </button>
  )
}
\`\`\`

### Custom Commands
\`\`\`tsx
const customCommands = [
  {
    id: "custom-action",
    label: "Custom Action",
    description: "Perform custom action",
    icon: CustomIcon,
    action: () => performCustomAction(),
    keywords: ["custom", "action"],
  },
]
\`\`\`

## Animation Patterns

### Staggered List Animation
\`\`\`tsx
<motion.div>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
\`\`\`

### Modal with Backdrop
\`\`\`tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center"
      >
        <div className="bg-darker p-8 rounded-xl">
          {content}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
\`\`\`

### Slide-in Drawer
\`\`\`tsx
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ type: "spring", damping: 25, stiffness: 200 }}
  className="fixed right-0 top-0 bottom-0 w-80 bg-darker"
>
  {drawerContent}
</motion.div>
\`\`\`

## Card Patterns

### Hover Card
\`\`\`tsx
<Card className="group hover:translate-y-[-8px] transition-transform hover:border-brand">
  <div className="p-6">
    <Icon className="w-12 h-12 text-brand mb-4 group-hover:scale-110 transition-transform" />
    <h3 className="text-xl font-semibold mb-2">Title</h3>
    <p className="text-muted-foreground">Description</p>
  </div>
</Card>
\`\`\`

### Interactive Card with Loading State
\`\`\`tsx
function InteractiveCard() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await performAction()
    setIsLoading(false)
  }

  return (
    <Card className="cursor-pointer hover:border-brand transition-colors">
      <div className="p-6" onClick={handleClick}>
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <h3>Title</h3>
            <p>Content</p>
          </>
        )}
      </div>
    </Card>
  )
}
\`\`\`

## Form Patterns

### Form with Validation
\`\`\`tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  amount: z.number().min(0.01).max(10000),
  address: z.string().min(1),
})

function TradeForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      address: "",
    },
  })

  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
\`\`\`

## Toast Notifications

### Success Toast
\`\`\`tsx
import { toast } from "react-hot-toast"

toast.success("Trade executed successfully!", {
  duration: 4000,
  position: "bottom-right",
})
\`\`\`

### Error Toast
\`\`\`tsx
toast.error("Failed to execute trade", {
  duration: 5000,
  position: "bottom-right",
})
\`\`\`

### Custom Toast
\`\`\`tsx
toast.custom((t) => (
  <div className="bg-darker border border-brand p-4 rounded-lg shadow-xl">
    <div className="flex items-center gap-3">
      <Zap className="w-6 h-6 text-brand" />
      <div>
        <div className="font-semibold">New Opportunity!</div>
        <div className="text-sm text-muted-foreground">
          Spread: 1.5% | Profit: $150
        </div>
      </div>
    </div>
  </div>
))
\`\`\`

## Loading States

### Skeleton Loader
\`\`\`tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-3/4" />
</div>
\`\`\`

### Spinner
\`\`\`tsx
<div className="flex items-center justify-center p-8">
  <Spinner className="w-8 h-8 text-brand" />
</div>
\`\`\`

## Responsive Patterns

### Responsive Grid
\`\`\`tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
\`\`\`

### Conditional Rendering
\`\`\`tsx
function ResponsiveComponent() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <>
      {isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </>
  )
}
