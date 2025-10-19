import {type FormEvent, useState} from 'react';
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import { convertPdfToImage } from "~/lib/pdf2image";
import {generateUUID} from "~/utils/formatSize";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const {auth,isLoading,fs,ai,kv}=usePuterStore();
    const navigate=useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setstatusText] = useState('')
    const [file, setFile] = useState<File|null>(null)

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({
         companyName,
         jobTitle,
         jobDescription,
         file
         }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        setIsProcessing(true);
        setstatusText('Uploading your resume...');

        const uploadedFile = await fs.upload([file]);

        if(!uploadedFile) return setstatusText('Error:Failed to upload file');
        setstatusText('converting to image...');

        const imageFile=await convertPdfToImage(file);
        if(!imageFile.file){
            const errMsg = imageFile.error || 'Failed to convert PDF to image';
            return setstatusText(`Error: ${errMsg}`);
        }

        setstatusText('Uploading the image...');
        const uploadedImage=await fs.upload([imageFile.file]);
        if(!uploadedImage) return setstatusText('Error:Failed to upload image');

        setstatusText('preparing data for analysis...');
        const uuid=generateUUID();
        const data={
            id:uuid,
            resumePath:uploadedFile.path,
            imagePath:uploadedImage.path,
            companyName,jobTitle,jobDescription,
            feedback:'',
        }
        await kv.set(`.resumes.${uuid}`,JSON.stringify(data));
        setstatusText('Analyzing...');
        const feedback=await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle,jobDescription})
        );
        if(!feedback) return setstatusText('Error:Failed to analyze');
        const feedbackText=typeof feedback.message.content==='string'
        ? feedback.message.content
        : feedback.message.content[0].text;

        data.feedback=JSON.parse(feedbackText);
        await kv.set(`.resumes.${uuid}`,JSON.stringify(data));
        setstatusText('Ananlysis complete...redirecting');

        navigate(`/resume/${uuid}`);
    }

    /*const handleAnalyze = async ({companyName:string,jobTitle:String,jobDescription:String,file:File})=>{
      setIsProcessing(true);
      setstatusText('Uploading your resume...');

        const uploadedFile=await fs.upload([file]);

      if(!uploadedFile) return setstatusText('Error:Failed to upload file');
      setstatusText('converting to image...');
      //const imageFile=await convertPdfToImage(file);
    }*/

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form=e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({companyName,jobTitle,jobDescription,file});
    }
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif"  className="w-full " />
                        </>
                    ):(
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form " onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" id="company-name" name="company-name" placeholder="company name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" id="job-title" name="job-title" placeholder="Job Title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <input type="text" id="job-description" name="job-description" placeholder="Job Description" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect}/>
                            </div>

                            <button className="primary-button" type="submit">
                                Analyse Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
            </main>
    );
};

export default Upload;