import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "resumind" },
    { name: "description", content: "Smart feedback from your dream job!" },
  ];
}

// Minimal loader to satisfy SSR GET requests for this route
export async function loader({}: Route.LoaderArgs) {
  return null;
}

function Home() {
    const {auth, kv, puterReady} = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);

    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated])

    useEffect(() => {
        const loadResumes = async () => {
            if (!puterReady || !auth.isAuthenticated) return;
            setLoadingResumes(true);

            const items = (await kv.list('.resumes.*', true)) as KVItem[];
            const parsedResumes = items?.map((item) => (
                JSON.parse(item.value) as Resume
            )) || [];
            setResumes(parsedResumes);
            setLoadingResumes(false);
        };
        loadResumes();
    }, [kv, puterReady, auth.isAuthenticated]);


    return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar/>
        <section className="main-section">
            <div className="page-heading py-16">
                <h1>track your application and resume rating</h1>
                {!loadingResumes && resumes?.length===0?(
                    <h2>NO Resume found.Upload your First Resume to Get feedback</h2>
                ):(
                    <h2>Review your submission and check AI-powered feedback</h2>
                )}
            </div>
            {loadingResumes &&(
                <div className="flex flex-col items-center justify-center">
                    <img src="/images/resume-scan-2.gif" className="w-[200px]"/>
                </div>
            )}


            {!loadingResumes && resumes.length > 0 && (
                <div className="resumes-section">
                    {resumes.map((resume) => (
                        <ResumeCard key={resume.id} resume={resume}/>
                    ))}
                </div>
            )}

            {!loadingResumes && resumes.length===0 && (
                <div className="flex flex-col items-center justify-center mt-10 gap-4">
                    <Link to="/upload" className="Primary-button w-fit text-xl font-semibold">
                        Upload Resume
                    </Link>
                </div>
            )}
        </section>


    </main>
}

export default Home;
