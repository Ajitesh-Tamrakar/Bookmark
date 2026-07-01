import SectionHeader from '../primitives/SectionHeader';
import Table from '../primitives/Table';
import Badge from '../primitives/Badge';
import SqlHint from './SqlHint';

const GRID = '1fr 88px 84px';

const TYPE_TONE = { video: 'info', image: 'muted', audio: 'audio' };

export default function TempFolderSection({ files }) {
  const counts = {};
  files.forEach((f) => { counts[f.type] = (counts[f.type] || 0) + 1; });
  const typeOrder = ['video', 'image', 'audio'];
  const present = typeOrder.filter((t) => counts[t]);
  const summary = `${files.length} files · ${present.map((t) => `${counts[t]} ${t}`).join(' · ')}`;

  return (
    <section id="temp" className="scroll-mt-14">
      <SectionHeader
        eyebrow="Temp folder"
        title="tmp/captures/ snapshot"
        description="Disk contents parsed from the {bookmark_id}_{content_type}.{ext} naming. Replay inventory — deliberately not joined against the bookmarks table."
      />
      <SqlHint>
        {`# filesystem read, no DB join\nls tmp/captures/  →  parse {bookmark_id}_{content_type}.{ext}`}
      </SqlHint>

      <div className="flex items-center justify-between gap-[14px] flex-wrap mb-3">
        <div className="font-mono text-[12.5px] text-text-muted">{summary}</div>
        <div className="flex gap-2">
          {present.map((t) => (
            <Badge key={t} tone={TYPE_TONE[t]} size="chip">
              {counts[t]} {t}
            </Badge>
          ))}
        </div>
      </div>

      <Table>
        <Table.Head columns={GRID}>
          <Table.HeadCell>filename</Table.HeadCell>
          <Table.HeadCell>content_type</Table.HeadCell>
          <Table.HeadCell align="right">size</Table.HeadCell>
        </Table.Head>

        {files.map((f) => {
          const name = `${f.bid}_${f.type}.${f.ext}`;
          return (
            <Table.Row key={name} columns={GRID}>
              <div className="font-mono text-[12px] text-text-inverse-muted truncate">{name}</div>
              <div>
                <Badge tone={TYPE_TONE[f.type] || TYPE_TONE.image} size="chip">{f.type}</Badge>
              </div>
              <div className="font-mono text-[11.5px] text-text-faint text-right">{f.size}</div>
            </Table.Row>
          );
        })}
      </Table>

      <div className="flex gap-[9px] items-start mt-[13px]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-[2px]">
          <circle cx="12" cy="12" r="9" stroke="var(--color-text-disabled)" strokeWidth="1.6" />
          <rect x="11.1" y="10.5" width="1.8" height="6" rx=".9" fill="var(--color-text-disabled)" />
          <circle cx="12" cy="7.6" r="1.05" fill="var(--color-text-disabled)" />
        </svg>
        <p className="text-[12px] text-text-faint leading-[1.55] m-0">
          After a dev-mode DB wipe these files are orphaned by design — that&apos;s the replay
          mechanism. Joining on bookmarks.id would hide exactly what this section exists to surface.
        </p>
      </div>
    </section>
  );
}
