# Modal

Accessible dialog with focus trap, scroll lock, role=dialog. Sub-components: ModalHeader, ModalBody, ModalFooter, ModalCloseButton.

Source: `vaneui-web/app/docs/data/overlay-components/modal.tsx` —
live demos at https://vaneui.com/docs/overlay-components/modal

## Basic Modal

A confirmation dialog with title, text, and action buttons. Modal includes focus trapping, scroll lock, and ARIA attributes (`role="dialog"`, `aria-modal="true"`) by default.

Modal defaults: `md` size, `primary` appearance, `outline` variant, `rounded` shape, `shadow`, `border`, `flex column`, `gap`, `padding`, `overflowAuto`.

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open Modal</Button>
<Modal open={open} onClose={() => setOpen(false)}>
  <Stack>
    <Text bold>Confirm Action</Text>
    <Text>Are you sure?</Text>
    <Row justifyEnd>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
      <Button primary filled onClick={() => setOpen(false)}>Confirm</Button>
    </Row>
  </Stack>
</Modal>
```

## Modal Sizes

Use size props to control the modal content width.

```tsx
<Modal open={open} onClose={onClose} sm>Small modal</Modal>
<Modal open={open} onClose={onClose} lg>Large modal</Modal>
```

## Form Modal

Modals can contain forms with inputs, labels, and checkboxes. Focus trapping keeps Tab navigation within the modal.

```tsx
<Modal open={open} onClose={onClose}>
  <Stack>
    <Label>Name</Label>
    <Input placeholder="Enter your name" />
    <Checkbox>I agree to the terms</Checkbox>
  </Stack>
</Modal>
```

## Blur Overlay

Pass `overlayProps={{ blur: true }}` to add a backdrop blur effect to the overlay behind the modal.

```tsx
<Modal open={open} onClose={onClose} overlayProps={{ blur: true }}>
  <Text>Blurred background</Text>
</Modal>
```

## Non-dismissible Modal

Disable `closeOnOverlayClick` and `closeOnEscape` to prevent closing the modal without explicit user action.

```tsx
<Modal
  open={open}
  onClose={onClose}
  closeOnOverlayClick={false}
  closeOnEscape={false}
>
  <Text>Must click a button to close</Text>
</Modal>
```

## Modal Appearances

Apply appearance and variant props to style the modal content area.

```tsx
<Modal open={open} onClose={onClose} primary filled>Primary modal</Modal>
<Modal open={open} onClose={onClose} danger filled>Danger modal</Modal>
```

## Compound Modal

Use `ModalHeader`, `ModalBody`, `ModalFooter`, and `ModalCloseButton` for full control over the modal layout. When any of these sub-components are detected as direct children, the modal switches to compound mode and renders them as-is without auto-wrapping.

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Button, Title, Input, Label, Stack, Row } from "@vaneui/ui";

<Modal open={open} onClose={() => setOpen(false)}>
  <ModalHeader>
    <Title>Edit Profile</Title>
    <ModalCloseButton />
  </ModalHeader>
  <ModalBody>
    <Stack>
      <Label>Name</Label>
      <Input placeholder="Enter your name" />
      <Label>Email</Label>
      <Input placeholder="Enter your email" />
    </Stack>
  </ModalBody>
  <ModalFooter>
    <Row justifyEnd>
      <Button sm onClick={() => setOpen(false)}>Cancel</Button>
      <Button sm primary filled onClick={() => setOpen(false)}>Save</Button>
    </Row>
  </ModalFooter>
</Modal>
```

## Convenience Props

Use the `title`, `footer`, and `withCloseButton` shorthand props to quickly set up a structured modal without manually composing sub-components. When `title` is set, a close button is shown by default (controlled by `withCloseButton`). The body content is passed as children.

```tsx
import { Modal, Button, Text, Row } from "@vaneui/ui";

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Quick Confirmation"
  footer={
    <Row justifyEnd>
      <Button sm onClick={() => setOpen(false)}>Cancel</Button>
      <Button sm primary filled onClick={() => setOpen(false)}>Confirm</Button>
    </Row>
  }
>
  <Text>Are you sure you want to proceed?</Text>
</Modal>
```

## Full Screen Modal

Set `fullScreen` to make the modal fill the entire viewport. Full-screen modals have no border-radius (`sharp` is applied automatically) and use a transparent overlay. This is useful for immersive experiences or mobile-optimized views.

```tsx
<Modal open={open} onClose={() => setOpen(false)} fullScreen>
  <ModalHeader>
    <Title>Full Screen View</Title>
    <ModalCloseButton />
  </ModalHeader>
  <ModalBody>
    <Text>Content fills the entire viewport.</Text>
  </ModalBody>
</Modal>
```

## Accessibility & Advanced Props

Modal includes built-in accessibility features that are enabled by default. You can customize them as needed:

| Prop | Default | Description |
|------|---------|-------------|
| `scrollLock` | `true` | Lock body scroll when modal is open |
| `focusTrap` | `true` | Trap Tab/Shift+Tab focus inside modal |
| `returnFocus` | `true` | Return focus to trigger element on close |
| `initialFocus` | — | Ref to element that receives focus on open |
| `portal` | `true` | Render in a portal (document.body) |
| `keepMounted` | `false` | Keep DOM node when closed |
| `noAnimation` | `false` | Disable enter/exit transitions |
| `transitionDuration` | `200` | Animation duration in ms |

Modal also renders with `role="dialog"` and `aria-modal="true"` automatically.

```tsx
{/* Custom focus target */}
<Modal open={open} onClose={onClose} initialFocus={inputRef}>
  <Input ref={inputRef} placeholder="Auto-focused" />
</Modal>

{/* Keep mounted for animation or state preservation */}
<Modal open={open} onClose={onClose} keepMounted transitionDuration={300}>
  <Text>Stays in DOM when closed</Text>
</Modal>
```
