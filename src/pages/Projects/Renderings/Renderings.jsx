import { useMemo, useState } from "react";
import { renderingsData } from "./componets/data";
import RenderingModal from "./componets/RenderingModal";

const ALL_TAG = "All";

const Renderings = () => {
  const [activeTags, setActiveTags] = useState([ALL_TAG]);
  const [selectedRendering, setSelectedRendering] = useState(null);

  const availableTags = useMemo(() => {
    const uniqueTags = [
      ...new Set(renderingsData.flatMap((item) => item.tags)),
    ];
    return [ALL_TAG, ...uniqueTags];
  }, []);

  const handleTagToggle = (tag) => {
    setActiveTags((prev) => {
      if (tag === ALL_TAG) {
        return [ALL_TAG];
      }

      const withoutAll = prev.filter((item) => item !== ALL_TAG);
      const isSelected = withoutAll.includes(tag);

      if (isSelected) {
        const next = withoutAll.filter((item) => item !== tag);
        return next.length > 0 ? next : [ALL_TAG];
      }

      return [...withoutAll, tag];
    });
  };

  const filteredRenderings = useMemo(() => {
    if (activeTags.includes(ALL_TAG)) {
      return renderingsData;
    }

    return renderingsData.filter((item) =>
      activeTags.every((tag) => item.tags.includes(tag)),
    );
  }, [activeTags]);

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Renderings
        </h1>

        <div className="mb-4 flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-[14px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${
                activeTags.includes(tag)
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRenderings.map((item) => (
            <button
              key={`${item.title}-${item.url}`}
              type="button"
              onClick={() => setSelectedRendering(item)}
              className="group flex flex-col items-start border border-slate-200/80 bg-white text-left shadow-sm transition-[border-color,box-shadow] ease-out hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
              style={{ transitionDuration: "2400ms" }}
            >
              <img
                src={item.url}
                alt={item.title}
                className="block h-56 w-full object-cover object-top sm:h-72"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <RenderingModal
        open={Boolean(selectedRendering)}
        item={selectedRendering}
        onClose={() => setSelectedRendering(null)}
      />
    </div>
  );
};

export default Renderings;
