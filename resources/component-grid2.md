# Grid2

Two-column CSS grid.

Source: `vaneui-web/app/docs/data/layout-components/grid2.tsx` —
live demos at https://vaneui.com/docs/layout-components/grid2

## Basic Grid2

A two-column grid layout.

```tsx
<Grid2>
  <div className="p-4 bg-gray-100 rounded">Item 1</div>
  <div className="p-4 bg-gray-100 rounded">Item 2</div>
  <div className="p-4 bg-gray-100 rounded">Item 3</div>
  <div className="p-4 bg-gray-100 rounded">Item 4</div>
</Grid2>
```

## Grid Sizes

Grids come in different sizes such as `xs`, `sm`, `md`, `lg`, `xl`.

```tsx
<Col lg>
  <div>
    <Text semibold>Extra Small Grid2</Text>
    <Grid2 xs>
      <div className="p-2 bg-gray-100 rounded text-sm">Item 1</div>
      <div className="p-2 bg-gray-100 rounded text-sm">Item 2</div>
    </Grid2>
  </div>
  <div>
    <Text semibold>Large Grid2</Text>
    <Grid2 lg>
      <div className="p-6 bg-gray-100 rounded">Item 1</div>
      <div className="p-6 bg-gray-100 rounded">Item 2</div>
    </Grid2>
  </div>
</Col>
```

## Grid with Gap

Control spacing between grid items.

```tsx
<Col lg>
  <div>
    <Text semibold>No Gap</Text>
    <Grid2 noGap>
      <div className="p-4 bg-gray-100 border">Item 1</div>
      <div className="p-4 bg-gray-100 border">Item 2</div>
    </Grid2>
  </div>
  <div>
    <Text semibold>With Gap</Text>
    <Grid2>
      <div className="p-4 bg-gray-100 rounded">Item 1 (default with gap)</div>
      <div className="p-4 bg-gray-100 rounded">Item 2</div>
    </Grid2>
  </div>
</Col>
```

## Grid Appearances

Grids can have different background appearances.

```tsx
<Col lg>
  <Grid2 primary>
    <div className="p-4 bg-white rounded">Item 1</div>
    <div className="p-4 bg-white rounded">Item 2</div>
  </Grid2>
  <Grid2 secondary>
    <div className="p-4 bg-white rounded">Item 1</div>
    <div className="p-4 bg-white rounded">Item 2</div>
  </Grid2>
</Col>
```

## Grid Variants

Grids support filled and outline variants.

```tsx
<Col lg>
  <Grid2 filled primary>
    <div className="p-4 bg-white rounded">Filled Primary Grid</div>
    <div className="p-4 bg-white rounded">Item 2</div>
  </Grid2>
  <Grid2 outline success>
    <div className="p-4 rounded">Outline Success Grid</div>
    <div className="p-4 rounded">Item 2</div>
  </Grid2>
</Col>
```
