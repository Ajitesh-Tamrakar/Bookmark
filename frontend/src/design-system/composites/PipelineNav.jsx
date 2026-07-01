import ScrollSpyNav from '../primitives/ScrollSpyNav';

export default function PipelineNav({ items, activeSection }) {
  return (
    <ScrollSpyNav items={items} activeSection={activeSection} label="Monitor" sticky="top-10" width="w-[140px]" />
  );
}
