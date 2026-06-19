import React, { useContext } from "react";
import { Context } from "../../main";
import { Link } from "react-router-dom";
import { FaFacebookF, FaGithub, FaLinkedin } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";

const Footer = () => {
  const { isAuthenticated } = useContext(Context);
  return (
    <footer className={isAuthenticated ? "footerShow" : "footerHide"}>
      <div>&copy; All Rights Reserved By CodeWithNabina.</div>
      <div>
        <Link to={"https://www.linkedin.com/in/nabina-bk/"} target="_blank">
          <FaLinkedin />
        </Link>
        <Link to={"https://github.com/Nabina2002"} target="_blank">
          <FaGithub />
        </Link>
        <Link to={"https://www.instagram.com/nabina_19/"} target="_blank">
          <RiInstagramFill />
        </Link>
        <Link to={"https://www.facebook.com/na.bina.102977"} target="_blank">
          <FaFacebookF />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
