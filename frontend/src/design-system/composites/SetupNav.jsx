import ScrollSpyNav from '../primitives/ScrollSpyNav';

export default function SetupNav({ items, activeSection }) {
  return (
    <ScrollSpyNav
      items={items}
      activeSection={activeSection}
      sticky="top-[72px]"
      width="w-[148px]"
      itemPadded
      alwaysMedium
      inactiveDotClass="bg-text-faint opacity-40"
    />
  );
}
