// import { useEffect } from "react";
// import { useLocation } from "react-router-dom";

// const ScrollToHash = () => {
//   const location = useLocation();

//   useEffect(() => {
//     if (location.hash) {
//       // Escape special CSS characters
//       const escapedHash = CSS.escape(location.hash.slice(1));
//       const element = document.querySelector(`#${escapedHash}`);
//       if (element) {
//         element.scrollIntoView({ behavior: "smooth" });
//       }
//     } else {
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   }, [location]);

//   return null;
// };

// export default ScrollToHash;
