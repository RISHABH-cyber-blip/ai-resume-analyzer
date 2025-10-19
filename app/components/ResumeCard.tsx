import React, {useEffect, useState} from 'react';
import { Link } from 'react-router';
import ScoreCircle from "~/components/ScoreCircle";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({resume:{id,companyName,jobTitle,feedback,imagePath}}:{resume:Resume}) => {

    const {fs, puterReady}=usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(()=>{
        let revokeUrl: string | null = null;
        const loadResume=async ()=>{
            if (!puterReady || !imagePath) return;
            const blob=await fs.read(imagePath);
            if(!blob) return;
            const url=URL.createObjectURL(blob);
            revokeUrl = url;
            setResumeUrl(url);
        }

        loadResume();
        return () => { if (revokeUrl) URL.revokeObjectURL(revokeUrl); };
    },[imagePath, fs, puterReady]);

    const score = typeof feedback === 'object' && feedback && (feedback as any).overallScore ? (feedback as any).overallScore as number : 0;

    return (
        <Link className="resume-card animate-in fade-in duration-1000" to={`/resume/${id}`}>
            <div className="resume-card-header">
                <div className="flex flec-col gap-2">
                    {companyName &&<h2 className="!text-black font-bold break-words">
                        {companyName}
                    </h2>}
                    {jobTitle &&<h3 className="text-lg break-words text-gray-500">
                        {jobTitle}
                    </h3>}
                    {!jobTitle && !companyName && <h2 className="!text-black font-bold">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={score} />
                </div>
            </div>

            {resumeUrl && (<div className="gradient-border animate-in fade-in duration-1000">
                <div className="w-full h-full">

                    <img
                        src={resumeUrl}
                        alt="resume"
                        className="w-full h-[350px] object-cover max-sm:h-[200px] object-top"
                    />

                </div>

            </div>)}
        </Link>

    );
};


export default ResumeCard;