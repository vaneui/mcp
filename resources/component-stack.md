# Stack

Vertical flexbox with padding + gap + flexWrap. General-purpose container.

Source: `vaneui-web/app/docs/data/layout-components/stack.tsx` —
live demos at https://vaneui.com/docs/layout-components/stack

## Basic Stack

A flexible layout container that arranges children vertically by default. Has `gap: true` and `padding: true` by default.

```tsx
<Stack>
  <div className="p-4 bg-gray-100 rounded">Item 1</div>
  <div className="p-4 bg-gray-100 rounded">Item 2</div>
  <div className="p-4 bg-gray-100 rounded">Item 3</div>
</Stack>
```

## Stack Direction

Use `row` for horizontal layout, default is column (vertical).

```tsx
<Row flexWrap>
  <Col>
    <Text semibold>Column (default)</Text>
    <Stack>
      <div className="p-4 bg-gray-100 rounded">Item 1</div>
      <div className="p-4 bg-gray-100 rounded">Item 2</div>
    </Stack>
  </Col>
  <Col>
    <Text semibold>Row</Text>
    <Stack row>
      <div className="p-4 bg-gray-100 rounded">Item 1</div>
      <div className="p-4 bg-gray-100 rounded">Item 2</div>
    </Stack>
  </Col>
</Row>
```

## Stack Spacing

Gap is enabled by default. Use size props (`sm`, `lg`) to control the gap amount, or `noGap` to disable.

```tsx
<Row flexWrap>
  <Col>
    <Text semibold>Small Gap</Text>
    <Stack sm>
      <div className="p-3 bg-gray-100 rounded">Item 1</div>
      <div className="p-3 bg-gray-100 rounded">Item 2</div>
    </Stack>
  </Col>
  <Col>
    <Text semibold>Large Gap</Text>
    <Stack lg>
      <div className="p-3 bg-gray-100 rounded">Item 1</div>
      <div className="p-3 bg-gray-100 rounded">Item 2</div>
    </Stack>
  </Col>
</Row>
```

## Stack Alignment

Control alignment with `justifyCenter`, `justifyBetween`, `itemsCenter`, etc.

```tsx
<Row flexWrap>
  <Col>
    <Text semibold>Justify Center</Text>
    <Stack justifyCenter className="h-32 border-2 border-dashed border-gray-300">
      <div className="p-4 bg-gray-100 rounded">Centered</div>
    </Stack>
  </Col>
  <Col>
    <Text semibold>Justify Between</Text>
    <Stack justifyBetween className="h-32 border-2 border-dashed border-gray-300">
      <div className="p-4 bg-gray-100 rounded">Top</div>
      <div className="p-4 bg-gray-100 rounded">Bottom</div>
    </Stack>
  </Col>
</Row>
```

## Stack Variants

Use `filled` or `outline` with appearance props for styled containers.

```tsx
<Row flexWrap>
  <Stack filled primary>
    <div className="p-4 bg-white/80 rounded">Filled Primary</div>
    <div className="p-4 bg-white/80 rounded">Item 2</div>
  </Stack>
  <Stack outline success>
    <div className="p-4 rounded">Outline Success</div>
    <div className="p-4 rounded">Item 2</div>
  </Stack>
</Row>
```

## Text Alignment

Use `textCenter`, `textLeft`, `textRight`, or `textJustify` to control text alignment within the stack.

```tsx
<Row flexWrap>
  <Stack textLeft className="flex-1 border-2 border-dashed border-gray-300 p-4">
    <Text semibold>Left Aligned</Text>
    <Text>Content aligned to the left.</Text>
  </Stack>
  <Stack textCenter className="flex-1 border-2 border-dashed border-gray-300 p-4">
    <Text semibold>Center Aligned</Text>
    <Text>Content centered within the stack.</Text>
  </Stack>
  <Stack textRight className="flex-1 border-2 border-dashed border-gray-300 p-4">
    <Text semibold>Right Aligned</Text>
    <Text>Content aligned to the right.</Text>
  </Stack>
</Row>
```

## Responsive Layout

Use `mobileCol` or `tabletCol` to switch between row and column layouts responsively.

```tsx
<Stack row tabletCol>
  <div className="p-4 bg-primary-100 rounded flex-1">
    <Text semibold>Column 1</Text>
    <Text>Horizontal on desktop, stacked on tablet and below.</Text>
  </div>
  <div className="p-4 bg-primary-100 rounded flex-1">
    <Text semibold>Column 2</Text>
    <Text>Resize to see the responsive behavior.</Text>
  </div>
</Stack>
```
