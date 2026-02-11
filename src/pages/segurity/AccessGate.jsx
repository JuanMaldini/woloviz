import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  hasPasscodeAccepted,
  isPasscodeValid,
  markPasscodeAccepted,
} from "../../auth/passcode";
// import Carousel from "../../components/carousel/Carousel";

const AccessGate = () => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || "/samplesvg";
  // const images = [
  //   { src: "/images/carouse-1.svg", alt: "Placeholder 1" },
  //   { src: "/images/carouse-2.svg", alt: "Placeholder 2" },
  //   { src: "/images/carouse-3.svg", alt: "Placeholder 3" },
  // ];

  useEffect(() => {
    if (hasPasscodeAccepted()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (isPasscodeValid(passcode)) {
      markPasscodeAccepted();
      navigate(from, { replace: true });
      return;
    }

    setError("");
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* <Carousel images={images} /> */}
      <div className="flex w-full flex-1 items-center justify-center ">{/*px-4 pb-12*/}
        <div className="w-full max-w-md bg-white border border-gray-200 p-4 shadow-lg">
          <p className="mt-2 text-sm text-gray-600">
            Contact us for a personalized demo.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-row space-x-4"
          >
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Code"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              autoFocus
              required
            />
            <button
              type="submit"
              className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Enter
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
