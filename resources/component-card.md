# Card

Bordered content container. padding + rounded + gap + border by default. href renders as <a>. Sub-components: CardHeader, CardBody, CardFooter.

Source: `vaneui-web/app/docs/data/layout-components/card.tsx` —
live demos at https://vaneui.com/docs/layout-components/card

## Basic Card

A simple card container with default styling.

```tsx
<Card>
  <Title>Welcome to VaneUI</Title>
  <Text>Build beautiful interfaces with ready-to-use components.</Text>
</Card>
```

## Card Sizes

Cards come in different sizes: `xs`, `sm`, `md` (default), `lg`, `xl`.

```tsx
<Row flexWrap>
  <Card sm>
    <Title sm>Small Card</Title>
    <Text sm>Compact content</Text>
  </Card>
  <Card>
    <Title>Medium Card</Title>
    <Text>Default size</Text>
  </Card>
  <Card lg>
    <Title lg>Large Card</Title>
    <Text lg>More spacious</Text>
  </Card>
</Row>
```

## Card Appearances

Cards support color appearances: `primary`, `brand`, `accent`, `secondary`, `tertiary`, `success`, `danger`, `warning`, `info`, `link`.

```tsx
<Row flexWrap>
  <Card primary>
    <Title>Primary</Title>
    <Text>Main action</Text>
  </Card>
  <Card brand>
    <Title>Brand</Title>
    <Text>Brand color</Text>
  </Card>
  <Card accent>
    <Title>Accent</Title>
    <Text>Highlight</Text>
  </Card>
  <Card secondary>
    <Title>Secondary</Title>
    <Text>Subtle styling</Text>
  </Card>
  <Card success>
    <Title>Success</Title>
    <Text>Positive status</Text>
  </Card>
  <Card danger>
    <Title>Danger</Title>
    <Text>Error or alert</Text>
  </Card>
</Row>
```

## Card Variants

Use `filled` for solid backgrounds. `outline` is the default. Add `shadow` for elevation.

```tsx
<Row flexWrap>
  <Card filled>
    <Title filled>Filled Card</Title>
    <Text filled>Solid background</Text>
  </Card>
  <Card>
    <Title>Outline Card (default)</Title>
    <Text>Border only</Text>
  </Card>
  <Card shadow>
    <Title>Shadow Card</Title>
    <Text>Elevated appearance</Text>
  </Card>
</Row>
```

## Card Shapes

Cards support different border radius styles: `rounded` (default), `pill`, and `sharp`.

```tsx
<Row flexWrap>
  <Card>
    <Title>Rounded</Title>
    <Text>Default style</Text>
  </Card>
  <Card pill>
    <Title>Pill</Title>
    <Text>Fully rounded</Text>
  </Card>
  <Card sharp>
    <Title>Sharp</Title>
    <Text>No radius</Text>
  </Card>
</Row>
```

## Responsive Layout

Use `row` for horizontal layout and `mobileCol` or `tabletCol` to switch to column on smaller screens.

```tsx
<Card row tabletCol>
  <Col>
    <Title>Product Image</Title>
    <Text secondary>Visual content area</Text>
  </Col>
  <Col>
    <Title>Product Details</Title>
    <Text>This layout switches to column on tablets and below. Resize to see the effect.</Text>
  </Col>
</Card>
```

## Card as Link

Add `href` to make the card a clickable link. The card automatically renders as an `<a>` tag when `href` is provided, ensuring valid HTML.

```tsx
<Row flexWrap>
  <Card href="#services" primary filled>
    <Title primary filled>Services</Title>
    <Text primary filled>Click to navigate</Text>
  </Card>
  <Card href="#pricing" secondary filled>
    <Title secondary filled>Pricing</Title>
    <Text secondary filled>View our plans</Text>
  </Card>
  <Card href="https://github.com" target="_blank" rel="noopener noreferrer" outline>
    <Title>External Link</Title>
    <Text>Opens in new tab</Text>
  </Card>
</Row>
```
