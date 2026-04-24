# Input

Text input. All native <input> attrs + VaneUI size / appearance / variant props.

Source: `vaneui-web/app/docs/data/basic-components/input.tsx` —
live demos at https://vaneui.com/docs/basic-components/input

## Basic Input

A styled text input field.

```tsx
<Input placeholder="Enter text..." />
```

## Input Sizes

Inputs come in different sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Col>
  <Input sm placeholder="Small input" />
  <Input placeholder="Medium input (default)" />
  <Input lg placeholder="Large input" />
</Col>
```

## Input Types

Various HTML input types for different use cases.

```tsx
<Col>
  <Input type="text" placeholder="Text input" />
  <Input type="email" placeholder="Email input" />
  <Input type="password" placeholder="Password input" />
  <Input type="number" placeholder="Number input" />
</Col>
```

## Input Variants

Inputs are `outline` by default. Use `filled` for solid backgrounds.

```tsx
<Col>
  <Row flexWrap>
    <Input placeholder="Outline (default)" />
    <Input success placeholder="Outline success" />
    <Input danger placeholder="Outline danger" />
  </Row>
  <Row flexWrap>
    <Input filled placeholder="Filled (default)" />
    <Input filled success placeholder="Filled success" />
    <Input filled danger placeholder="Filled danger" />
  </Row>
</Col>
```

## Input with Labels

Pair inputs with labels for accessibility and better UX. When the `Input` is nested inside a `Label`, it inherits the Label's size — set it once on the Label.

```tsx
<Col>
  <Label>
    Full Name
    <Input type="text" placeholder="Enter your full name" />
  </Label>
  <Label lg>
    Email Address (large)
    <Input type="email" placeholder="Enter your email" />
  </Label>
</Col>
```

## Input Shapes

Inputs support border radius styles: `rounded` (default), `pill`, and `sharp`.

```tsx
<Row flexWrap>
  <Input rounded placeholder="Rounded (default)" />
  <Input pill placeholder="Pill shape" />
  <Input sharp placeholder="Sharp corners" />
</Row>
```

## Input States

Different input states: disabled, readonly, and validation feedback. Use appearance props (`success`, `danger`) for visual feedback, or the `error` status prop for form validation state.

```tsx
<Input placeholder="Normal input" />
<Input disabled placeholder="Disabled input" />
<Input success placeholder="Success state" />
<Input danger placeholder="Error state" />
<Input error placeholder="Validation error" />
```

```tsx
<Col>
  <Input placeholder="Normal input" />
  <Input disabled placeholder="Disabled input" />
  <Input success placeholder="Success state" />
  <Input danger placeholder="Error state" />
  <Input error placeholder="Validation error (status)" />
</Col>
```
