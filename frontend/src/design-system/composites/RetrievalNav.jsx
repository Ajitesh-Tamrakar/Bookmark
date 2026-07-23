import ScrollSpyNav from '../primitives/ScrollSpyNav';

export default function RetrievalNav({ items, activeSection }) {
  return (
    <ScrollSpyNav items={items} activeSection={activeSection} label="Retrieval" sticky="top-10" width="w-[140px]" />
  );
}
