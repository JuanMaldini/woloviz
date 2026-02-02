import { Link } from "react-router-dom";
import { useMemo } from "react";
import "./NotFound.css";

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
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Page Not Found</h1>
        <div className="not-found__image">
          <img src={randomImage} alt="404 error" />
        </div>
        <div className="not-found__actions">
          <Link to="/" className="btn">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
