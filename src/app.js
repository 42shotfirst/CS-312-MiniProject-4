// client/src/App.js

import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

const App = () => {
    return (
        <Router>
            <div className="app-container">
                <Switch>
                    <Route path="/signin" component={SignIn} />
                    <Route path="/signup" component={SignUp} />
                    {/* Add other routes as needed */}
                    <Route path="/" exact>
                        <h1>Welcome to Our Application</h1>
                        <p>Please <a href="/signin">sign in</a> or <a href="/signup">sign up</a>.</p>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
};

export default App;
