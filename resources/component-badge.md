# Badge

Compact status / count indicator. Pill + uppercase + semibold by default.

Source: `vaneui-web/app/docs/data/basic-components/badge.tsx` —
live demos at https://vaneui.com/docs/basic-components/badge

## Basic Usage

Badge styles and variants.

```tsx
<Row flexWrap>
  {
    ComponentKeys.appearance.map((key) => (
      <Badge key={key} {...{[key]: true}}>{appearanceLabels[key]}</Badge>
    ))
  }
</Row>
```

## Badge Sizes

Badges come in different sizes such as `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.size.map((key) => (
      <Badge key={key} {...{[key]: true}}>{sizeLabels[key]}</Badge>
    ))
  }
</Row>
```

## Badge Shapes

Badges support different border radius styles: `rounded`, `pill` (default), and `sharp`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.shape.map((key: string) => (
      <Badge key={key} {...{[key]: true}}>Pro</Badge>
    ))
  }
</Row>
```

## Badge Variants

Badges can be styled as `outline` (default) or `filled`.

```tsx
<Col>
  {
    ComponentKeys.variant.map((variant) => (
      <Row key={variant} flexWrap>
        {
          ComponentKeys.appearance.slice(0, 4).map((appearance) => (
            <Badge key={`${variant}-${appearance}`} {...{[variant]: true, [appearance]: true}}>
              {appearanceLabels[appearance]}
            </Badge>
          ))
        }
      </Row>
    ))
  }
</Col>
```

## Font Weights

Badges support different font weights.

```tsx
<Row flexWrap>
  {
    ComponentKeys.fontWeight.slice(3, 7).map((key: string) => (
      <Badge key={key} {...{[key]: true}}>Premium</Badge>
    ))
  }
</Row>
```
