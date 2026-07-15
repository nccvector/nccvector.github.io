const projects = [
  {
    index: "01",
    title: "Efficient manipulator motion planning",
    eyebrow: "MuJoCo · OMPL · C++",
    image: "/images/manipulator-motion-planning.png",
    imageAlt: "UR5e manipulator planning a collision-free path through a cluttered workspace",
    href: "https://github.com/nccvector/motion-planning",
    copy: [
      "Sampling-based planners can find a path through clutter, but solving every motion from scratch makes repeated robot work feel wasteful and unpredictable. This project began as a collision-aware UR5e planning lab and grew into a system that learns from the paths it has already solved.",
      "It combines MuJoCo simulation with OMPL planning, cached loop paths, reusable experience roadmaps, continuous background optimization, and a controlled execution handoff. The result is a practical test bed for making repeated manipulator motion faster without losing contact, clearance, or tracking checks.",
    ],
  },
  {
    index: "02",
    title: "Kinodynamic planning for trailer-truck parking",
    eyebrow: "Vehicle dynamics · SAC · C++ / Python",
    image: "/images/trailer-truck-parking.png",
    imageAlt: "Top-down tractor-trailer following a constrained reverse parking path",
    href: "https://github.com/nccvector/motion-planning/tree/main/trailer-truck",
    copy: [
      "Parking an articulated vehicle is not a waypoint problem: steering, direction changes, hitch angle, swept volume, and collision constraints all shape which paths can actually be driven. This work builds those constraints into a compact trailer-truck simulator and planning environment.",
      "A curriculum-driven SAC policy learns forward and reverse maneuvers from planner-shaped routes, sparse checkpoint rewards, and mirrored replay. Batched C++ simulation keeps experiments fast, while deterministic evaluation measures checkpoint completion and path-tracking error across increasingly difficult parking and clutter scenarios.",
    ],
  },
  {
    index: "03",
    title: "Optical simulation as a small, composable system",
    eyebrow: "Ray tracing · C++23 · Spectral optics",
    image: "/images/opsys-collage.png",
    imageAlt: "Collage of ray traces through four optical lens presets",
    href: "https://github.com/nccvector/opsys",
    copy: [
      "Optical code often hides simple physics behind deep object hierarchies and runtime indirection. opsys takes the opposite approach: fixed prescriptions, value-type surfaces and mediums, and free functions that make the path of a ray easy to inspect.",
      "The header-only C++23 library supports analytic plane and conic intersections, wavelength-dependent refractive indices, forward and reverse tracing, and caller-owned ray types. A raylib editor turns the same model into deterministic visualizations for real lens prescriptions, from double-Gauss designs to fisheye and telephoto systems.",
    ],
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Project({ project, position }) {
  return (
    <article className={`project project--${position}`}>
      <a className="project__link" href={project.href} target="_blank" rel="noreferrer">
        <div className="project__image-wrap">
          <img className="project__image" src={project.image} alt={project.imageAlt} />
          <span className="project__number">{project.index}</span>
        </div>
        <div className="project__body">
          <p className="eyebrow">{project.eyebrow}</p>
          <h3>{project.title}</h3>
          {project.copy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <span className="project__cta">
            View repository <Arrow />
          </span>
        </div>
      </a>
    </article>
  );
}

export default function App() {
  return (
    <main>
      <header className="site-header shell">
        <a className="wordmark" href="#top" aria-label="Faizan Ali, home">
          FA<span> / Robotics</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#work">Projects</a>
          <a href="https://github.com/nccvector" target="_blank" rel="noreferrer">
            GitHub <Arrow />
          </a>
        </nav>
      </header>

      <section className="hero shell" id="top">
        <div className="hero__lead">
          <p className="eyebrow">Robotics software engineer · Tokyo</p>
          <h1>
            I build software for machines that must <em>work in the real world.</em>
          </h1>
          <a className="scroll-cue" href="#about">
            Scroll to explore <span aria-hidden="true">↓</span>
          </a>
        </div>
        <figure className="portrait">
          <img src="/images/faizan-ali.png" alt="Faizan Ali" />
          <figcaption>
            <span>Faizan Ali</span>
            Simulation · Planning · Control
          </figcaption>
        </figure>
      </section>

      <section className="about shell" id="about">
        <p className="section-label">About</p>
        <div className="about__copy">
          <p className="about__opening">
            I’m a robotics software engineer specializing in simulation, motion planning, control,
            and system-level problem solving.
          </p>
          <div className="about__columns">
            <p>
              I build software that connects mathematical models with real-world robotic systems—from
              vehicle dynamics and closed-loop simulation to calibration, data collection, and failure
              analysis. My main tools are C++, Python, ROS, and modern optimization and simulation
              frameworks.
            </p>
            <p>
              I enjoy difficult engineering problems where physics, software architecture, and
              experimentation meet. I care about understanding systems deeply, building reliable tools,
              and turning ambiguous technical problems into practical, testable solutions.
            </p>
          </div>
        </div>
      </section>

      <section className="work shell" id="work">
        <div className="work__heading">
          <p className="section-label">Selected projects</p>
          <h2>Systems explored through code, physics, and experiments.</h2>
        </div>
        <div className="projects">
          {projects.map((project, index) => (
            <Project key={project.title} project={project} position={index % 2 ? "reverse" : "forward"} />
          ))}
        </div>
      </section>

      <footer className="footer shell">
        <p>Faizan Ali</p>
        <p>Robotics software, built from first principles.</p>
        <a href="https://github.com/nccvector" target="_blank" rel="noreferrer">
          github.com/nccvector <Arrow />
        </a>
      </footer>
    </main>
  );
}
