# Container

Centered max-width wrapper. Flex column + itemsCenter + gap.

Source: `vaneui-web/app/docs/data/layout-components/container.tsx` —
live demos at https://vaneui.com/docs/layout-components/container

## Basic Container

A centered content wrapper with max-width constraint.

```tsx
<Container>
  <Title>Page Content</Title>
  <Text>Container centers content and constrains width for optimal readability.</Text>
</Container>
```

## Container Sizes

Containers come in different sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Col>
  <Container sm border>
    <Text semibold>Small Container</Text>
    <Text>Narrower max-width</Text>
  </Container>
  <Container lg border>
    <Text semibold>Large Container</Text>
    <Text>Wider max-width for more content</Text>
  </Container>
</Col>
```

## Container Appearances

Containers support color appearances: `primary`, `secondary`, `success`, `danger`, etc.

```tsx
<Col>
  <Container primary>
    <Text semibold>Primary Container</Text>
    <Text>Highlighted content area</Text>
  </Container>
  <Container success>
    <Text semibold>Success Container</Text>
    <Text>Positive feedback area</Text>
  </Container>
</Col>
```

## Container Variants

Use `filled` for solid backgrounds. `outline` is the default. Add `shadow` for elevation.

```tsx
<Col>
  <Container filled primary>
    <Title filled primary>Filled Container</Title>
    <Text filled primary>Solid background with primary color</Text>
  </Container>
  <Container secondary>
    <Title secondary>Outline Container (default)</Title>
    <Text secondary>Border only styling</Text>
  </Container>
  <Container shadow>
    <Title>Shadow Container</Title>
    <Text>Elevated with drop shadow</Text>
  </Container>
</Col>
```

## Container Shapes

Containers support different border radius styles. `sharp` is the default (no radius).

```tsx
<Col>
  <Container border>
    <Text semibold>Sharp (default)</Text>
  </Container>
  <Container rounded border>
    <Text semibold>Rounded corners</Text>
  </Container>
  <Container pill border>
    <Text semibold>Pill shape</Text>
  </Container>
</Col>
```

## Page Layout Pattern

Nest Container inside Section for a standard page layout with centered, width-constrained content.

```tsx
<Section>
  <Container sm>
    <Title primary>Getting Started</Title>
    <Text>This content is centered and constrained to a small max-width for optimal readability.</Text>
  </Container>
</Section>
```
