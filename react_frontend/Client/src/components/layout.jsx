import React from "react";
// import Footer from "./Footer";
// import Header from "./Header";
// import { Helmet } from "react-helmet";
// import { Toaster } from "react-hot-toast";
const Layout = ({ children, title, description, keywords, author }) => {
  return (
    <div>
      
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <title>{title}</title>
      
      <main style={{ minHeight: "70vh" }}>
        

        {children}
      </main>
    </div>
  );
};

Layout.defaultProps = {
  title: "Ecommerce app - shop now",
  description: "mern stack project",
  keywords: "mern,react,node,mongodb",
  author: "Techinfoyt",
};

export default Layout;