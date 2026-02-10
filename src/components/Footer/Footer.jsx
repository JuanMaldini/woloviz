const CONTACT_EMAIL = "contact@woloviz.com";

const buildContactMailtoHref = () => {
  const subject = "Consult from the web";
  const body = `Hello Woloviz team,\n\nI am reaching out regarding the following:\n\n- Name: \n- Message: \n\nThank you.`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
};

const Footer = () => (
  <section>
    <footer className="bg-white text-slate-600 shadow-[0_-1px_3px_0_rgba(0,0,0,0.1),0_-1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-[1100px] items-center justify-end gap-3 px-4 py-2 sm:px-6 sm:py-3">
        <a
          id="footer-contact-link"
          className="relative inline-flex items-center rounded-lg px-2 py-1 text-[14px] font-medium text-slate-900 no-underline transition-colors duration-150 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 focus-visible:outline-offset-2 after:absolute after:bottom-1 after:left-2 after:right-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-150 after:content-[''] hover:after:scale-x-100 focus-visible:after:scale-x-100"
          href={buildContactMailtoHref()}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = buildContactMailtoHref();
          }}
        >
          Contact
        </a>
      </div>
    </footer>
  </section>
);

export default Footer;
