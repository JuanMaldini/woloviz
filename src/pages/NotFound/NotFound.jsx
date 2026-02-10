import { Link } from "react-router-dom";
import { useMemo } from "react";

const ERROR_IMAGES = [
  "https://ih1.redbubble.net/image.2515682869.7692/raf,360x360,075,t,fafafa:ca443f4786.jpg",
  "https://media.tenor.com/5mHcoecT-QUAAAAM/crying.gif",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7NXIjct6PTDlH0PnGPy0ND0NtXa2cP3PIEqcSreN1VNqCQ8eL65d27S3UycOVXWN25Vk&usqp=CAU",
  "https://i.imgflip.com/br1q2.jpg",
  "https://media.tenor.com/OJbN3TbeEy0AAAAe/but-i%E2%80%99m-not-original.png",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbvSxolw6_yyWJV8G2XrRLpUZvD67BFB9_f2naPKBPJLCtwNMgnkcJbT7BPW7O3a_MGyY&usqp=CAU",
];

const NotFound = () => {
  const randomImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * ERROR_IMAGES.length);
    return ERROR_IMAGES[randomIndex];
  }, []);
  return (
    <div className="grid min-h-[80dvh] place-items-center px-6 py-6 text-center">
      <div className="w-full max-w-[600px]">
        <div className="mb-6 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-[120px] font-black leading-none tracking-[-4px] text-transparent">
          404
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          Page Not Found
        </h1>
        <div className="my-6 flex items-center justify-center">
          <img
            src={randomImage}
            alt="404 error"
            className="h-[180px] max-w-full rounded-xl object-contain shadow-md"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-[10px] border border-slate-900 bg-slate-900 px-6 text-[15px] font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-950 hover:bg-slate-950 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 focus-visible:outline-offset-2"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
