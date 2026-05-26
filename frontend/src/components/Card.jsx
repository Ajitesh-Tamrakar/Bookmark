// import react from 'react';

// function Card({ title, description }) {
    
//     return (
//         <div className="$$card bg-base-100 w-96 shadow-sm">
//             <figure>
//                 <img
//                     src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
//                     alt="Shoes" />
//             </figure>
//             <div className="$$card-body">
//                 <h2 className="$$card-title">
//                     Card Title
//                     <div className="$$badge $$badge-secondary">NEW</div>
//                 </h2>
//                 <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
//                 <div className="$$card-actions justify-end">
//                     <div className="$$badge $$badge-outline">Fashion</div>
//                     <div className="$$badge $$badge-outline">Products</div>
//                 </div>
//             </div>
//         </div>
//     );

// }

// export default Card;

// 1. Install dependencies:
// npm install framer-motion lucide-react

import AspectRatio from '@mui/joy/AspectRatio';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import BookmarkAdd from '@mui/icons-material/BookmarkAddOutlined';

export default function BasicCard({title, date, imageUrl}) {
    const video_id = imageUrl.split('v=')[1];
  return (
    <Card sx={{ width: 320 }}>
      <div>
        <Typography level="title-lg">{title}</Typography>
        <Typography level="body-sm">{date}</Typography>
        {/* <IconButton
          aria-label="bookmark Bahamas Islands"
          variant="plain"
          color="neutral"
          size="sm"
          sx={{ position: 'absolute', top: '0.875rem', right: '0.5rem' }}
        >
          <BookmarkAdd />
        </IconButton> */}
      </div>
      <AspectRatio minHeight="120px" maxHeight="200px">
        
        <img
          src={video_id ? `https://img.youtube.com/vi/${video_id}/0.jpg` : imageUrl}
          srcSet={video_id ? `https://img.youtube.com/vi/${video_id}/0.jpg` : imageUrl}
          loading="lazy"
          alt=""
        />
      </AspectRatio>
      <CardContent orientation="horizontal">
        {/* <div>
          <Typography level="body-xs">Total price:</Typography>
          <Typography sx={{ fontSize: 'lg', fontWeight: 'lg' }}>$2,900</Typography>
        </div> */}
        <Button
          variant="solid"
          size="md"
          color="primary"
          aria-label="Explore Bahamas Islands"
          sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 600 }}
        >
          Explore
        </Button>
      </CardContent>
    </Card>
  );
}
