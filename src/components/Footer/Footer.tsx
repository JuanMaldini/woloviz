import "./Footer.css";

const CONTACT_EMAIL = "contact@woloviz.com";

const buildContactMailtoHref = (): string => {
  const subject = "Consult from the web";
  const body = `Hello Woloviz team,\n\nI am reaching out regarding the following:\n\n- Name: \n- Message: \n\nThank you.`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
};

const Footer = () => (
  <section className="FooterTop">
    <footer className="topsColor">
      <div className="footer-content">
        <a
          id="footer-contact-link"
          className="contact-link footer-link-underline"
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
