import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="" width={32} height={32} />
          <h2 className="footer-tagline">Make something people (probably) want.</h2>
        </div>

        <div className="footer-cols">
          <div>
            <h3>Programs</h3>
            <ul>
              <li>
                <Link href="/add">The Other 99%</Link>
              </li>
              <li>
                <Link href="/">Startup Directory</Link>
              </li>
              <li>
                <Link href="/jobs">Work at a Startup</Link>
              </li>
              <li>
                <Link href="/add">Pay $20, get listed</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Resources</h3>
            <ul>
              <li>
                <Link href="/resources">Resources</Link>
              </li>
              <li>
                <Link href="/library">Library</Link>
              </li>
              <li>
                <Link href="/partners">Partners</Link>
              </li>
              <li>
                <Link href="/jobs">Startup Jobs</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of Use</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} WhyAlligator</p>
        <a
          className="footer-x"
          href="https://x.com/Prajwal_shindee"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.03-9.17L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18h1.81L7.01 3.91H5.07L17.084 20Z"
            />
          </svg>
          @Prajwal_shindee
        </a>
      </div>
    </footer>
  );
}
