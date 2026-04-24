# Button

Triggers an action. Supports boolean props for appearance, size, variant, shape, font weight, and can render as <a> via href.

Source: `vaneui-web/app/docs/data/basic-components/button.tsx` —
live demos at https://vaneui.com/docs/basic-components/button

## Basic Usage

Button styles and variants.

```tsx
<Row flexWrap>
  {
    ComponentKeys.appearance.map((key) => (
      <Button key={key} {...{[key]: true}}>{appearanceLabels[key]}</Button>
    ))
  }
</Row>
```

## Sizes

Buttons come in different sizes - `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.size.map((key) => (
      <Button key={key} {...{[key]: true}}>{sizeLabels[key]}</Button>
    ))
  }
</Row>
```

## Sizes with Icon

Buttons come in different sizes such as `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Row flexWrap>
  <Button xs><span className="rounded-full size-4 bg-gray-300"/> Extra Small</Button>
  <Button sm><span className="rounded-full size-4.5 bg-gray-300"/> Small</Button>
  <Button md><span className="rounded-full size-5 bg-gray-300"/> Medium</Button>
  <Button lg><span className="rounded-full size-6 bg-gray-300"/> Large</Button>
  <Button xl><span className="rounded-full size-7 bg-gray-300"/> Extra Large</Button>
</Row>
```

## Font Weights

Buttons support different font weights.

```tsx
<Row flexWrap>
  {
    ComponentKeys.fontWeight.map((key: string) => (
      <Button key={key} {...{[key]: true}}>Submit</Button>
    ))
  }
</Row>
```

## Border Radius Options

Button supports three border radius styles: `rounded` (default), `pill`, and `sharp`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.shape.map((key: string) => (
      <Button key={key} {...{[key]: true}}>Subscribe</Button>
    ))
  }
</Row>
```

## Button as Link & Disabled

Use `href` to render a Button as an `<a>` tag for navigation. Use `disabled` to prevent interaction.

```tsx
<Button href="/docs">Go to Docs</Button>
<Button disabled>Disabled</Button>
```

```tsx
<Row flexWrap>
  <Button href="#">Link Button</Button>
  <Button success filled href="#">Success Link</Button>
  <Button disabled>Disabled</Button>
  <Button danger filled disabled>Disabled Danger</Button>
</Row>
```

## Button Styles

Buttons can be styled as `outline` (default) or `filled`.

```tsx
<Col>
  {
    ComponentKeys.variant.map((variant) => (
      <Row key={variant} flexWrap>
        {
          ComponentKeys.appearance.slice(0, 4).map((appearance) => (
            <Button key={`${variant}-${appearance}`} {...{[variant]: true, [appearance]: true}}>
              {appearanceLabels[appearance]}
            </Button>
          ))
        }
      </Row>
    ))
  }
</Col>
```
