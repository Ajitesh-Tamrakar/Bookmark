import AspectRatio from '@mui/joy/AspectRatio';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Typography from '@mui/joy/Typography';

export default function BookmarkCard({ item, index }) {
  const videoId = item.url?.includes('v=') ? item.url.split('v=')[1] : null;
  const matchScore = Math.round((1 - item.distance) * 100);
  const date = new Date(item.saved_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'both',
      }}
      className="animate-fade-up"
    >
      <Card sx={{ width: 320 }}>
        <div>
          <Typography level="title-lg">{item.title}</Typography>
          <Typography level="body-sm">{item.author} · {date}</Typography>
        </div>

        <AspectRatio minHeight="120px" maxHeight="200px">
          <img
            src={videoId
              ? `https://img.youtube.com/vi/${videoId}/0.jpg`
              : item.url}
            loading="lazy"
            alt={item.title}
          />
        </AspectRatio>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 2px' }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '11px',
                background: '#e8eeff',
                color: '#296ec7',
                borderRadius: '20px',
                padding: '2px 8px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <CardContent orientation="horizontal">
          <Typography level="body-xs" sx={{ alignSelf: 'center' }}>
            {matchScore}% match
          </Typography>
          <Button
            variant="solid"
            size="md"
            color="primary"
            onClick={() => window.open(item.url, '_blank')}
            sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 600 }}
          >
            Watch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}