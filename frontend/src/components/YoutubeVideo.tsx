import React from 'react';

interface YoutubeVideoProps {
    videoId: string;
    title: string;
}

const YoutubeVideo: React.FC<YoutubeVideoProps> = ({ videoId, title }) => {
    return (
        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black group relative">
            <iframe
                className="w-full h-full border-none"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
            <div className="absolute inset-0 pointer-events-none border-4 border-primary/20 rounded-2xl group-hover:border-primary/40 transition-all"></div>
        </div>
    );
};

export default YoutubeVideo;
