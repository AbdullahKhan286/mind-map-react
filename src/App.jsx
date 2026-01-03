import MindMap from './components/MindMap.jsx';

const data = {
  id: 'root',
  label: 'Programming Languages',
  children: [
    {
      id: 'frontend',
      label: 'Frontend',
      children: [
        {
          id: 'javascript',
          label: 'JavaScript',
          children: [
            { id: 'react', label: 'React' },
            { id: 'vue', label: 'Vue.js' },
            { id: 'angular', label: 'Angular' }
          ]
        },
        {
          id: 'css',
          label: 'Styling',
          children: [
            { id: 'tailwind', label: 'Tailwind CSS' },
            { id: 'bootstrap', label: 'Bootstrap' }
          ]
        }
      ]
    },
    {
      id: 'backend',
      label: 'Backend',
      children: [
        {
          id: 'nodejs',
          label: 'Node.js',
          children: [
            { id: 'express', label: 'Express' },
            { id: 'nestjs', label: 'NestJS' }
          ]
        },
        {
          id: 'python',
          label: 'Python',
          children: [
            { id: 'django', label: 'Django' },
            { id: 'flask', label: 'Flask' }
          ]
        }
      ]
    },
    {
      id: 'mobile',
      label: 'Mobile',
      children: [
        { id: 'react-native', label: 'React Native' },
        { id: 'flutter', label: 'Flutter' },
        { id: 'swift', label: 'Swift' }
      ]
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