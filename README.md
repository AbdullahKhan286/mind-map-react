# React Mind Map

## ✨ Features

- 🎯 **Simple** - Just one file, drop it in your project
- 📊 **Interactive** - Click to expand/collapse nodes
- 📜 **Scrollable** - Native browser scrolling for large maps
- 🎨 **Customizable** - Easy to customize colors and spacing
- ⚡ **Smooth** - Beautiful animations
- 📱 **Responsive** - Works on all screen sizes


## 📖 Usage

```jsx
import React from 'react';
import MindMap from './MindMap';

const data = {
  id: 'root',
  label: 'My Mind Map',
  children: [
    {
      id: 'child1',
      label: 'Topic 1',
      children: [
        { id: 'sub1', label: 'Subtopic 1' },
        { id: 'sub2', label: 'Subtopic 2' }
      ]
    },
    {
      id: 'child2',
      label: 'Topic 2'
    }
  ]
};

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto' }}>
      <MindMap data={data} />
    </div>
  );
}
```

## 📊 Data Format

The component accepts JSON data in this format:

```javascript
{
  id: 'unique-id',        // Required: Unique identifier
  label: 'Display Text',  // Required: Text to display (can also use 'name')
  children: [...]         // Optional: Array of child nodes
}
```

## 🎨 Customization

You can customize colors, spacing, and more:

```jsx
<MindMap 
  data={data}
  colors={{
    root: { fill: '#fecaca', stroke: '#dc2626' },
    branch: { fill: '#fed7aa', stroke: '#ea580c' },
    leaf: { fill: '#d9f99d', stroke: '#65a30d' },
    link: '#94a3b8'
  }}
  nodeSpacing={{ x: 300, y: 100 }}
  onNodeClick={(node) => console.log('Clicked:', node)}
  onNodeExpand={(id, isExpanded) => console.log(`${id} ${isExpanded ? 'expanded' : 'collapsed'}`)}
/>
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Object | **Required** | Tree data in JSON format |
| `nodeSpacing` | Object | `{ x: 360, y: 120 }` | Horizontal and vertical spacing between nodes |
| `animationDuration` | Number | `260` | Animation duration in milliseconds |
| `padding` | Number | `60` | Padding around the diagram |
| `colors` | Object | See above | Color scheme for nodes and links |
| `nodeRadius` | Number | `7` | Radius of node circles |
| `nodeLabelGap` | Number | `14` | Gap between circle and label |
| `onNodeClick` | Function | `null` | Callback when a node is clicked |
| `onNodeExpand` | Function | `null` | Callback when a node is expanded/collapsed |
| `className` | String | `''` | Additional CSS classes |
| `style` | Object | `{}` | Additional inline styles |



## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📄 License

MIT License - feel free to use this in your projects!

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [d3-hierarchy](https://github.com/d3/d3-hierarchy)

---

Made with ❤️ by [Your Name]# mind-map-react
