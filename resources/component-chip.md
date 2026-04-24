# Chip

Tag / filter token. Defaults to secondary appearance + monospace.

Source: `vaneui-web/app/docs/data/basic-components/chip.tsx` —
live demos at https://vaneui.com/docs/basic-components/chip

## Basic Usage

Chip styles and variants.

```tsx
<Row flexWrap>
  {
    ComponentKeys.appearance.map((key) => (
      <Chip key={key} {...{[key]: true}}>{appearanceLabels[key]}</Chip>
    ))
  }
</Row>
```

## Chip Sizes

Chips come in different sizes such as `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.size.map((key) => (
      <Chip key={key} {...{[key]: true}}>{sizeLabels[key]}</Chip>
    ))
  }
</Row>
```

## Chip Shapes

Chips support different border radius styles: `rounded` (default), `pill`, and `sharp`.

```tsx
<Row flexWrap>
  {
    ComponentKeys.shape.map((key: string) => (
      <Chip key={key} {...{[key]: true}}>JavaScript</Chip>
    ))
  }
</Row>
```

## Chip Variants

Chips can be styled as `outline` (default) or `filled`.

```tsx
<Col>
  {
    ComponentKeys.variant.map((variant) => (
      <Row key={variant} flexWrap>
        {
          ComponentKeys.appearance.slice(0, 4).map((appearance) => (
            <Chip key={`${variant}-${appearance}`} {...{[variant]: true, [appearance]: true}}>
              {appearanceLabels[appearance]}
            </Chip>
          ))
        }
      </Row>
    ))
  }
</Col>
```

## Chip with Icon

Chips can contain icons along with text.

```tsx
<Row flexWrap>
  <Chip brand>
    <Heart className="size-4"/> Brand with Icon
  </Chip>
  <Chip success>
    <CheckSquare className="size-4"/> Success with Icon
  </Chip>
  <Chip danger>
    <X className="size-4"/> Danger with Icon
  </Chip>
</Row>
```
