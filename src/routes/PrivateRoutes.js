import React from "react";
import { Route, BrowserRouter } from "react-router-dom";

import Home from "./Home";
import Sobre from "./Sobre";
import Usuario from "./Usuario";

const Routes = () => {
   return(
       <BrowserRouter>
           <Route component = { Home }  path="/" exact />
           <Route component = { Login }  path="/login" />
       </BrowserRouter>
   )
}

export default Routes;