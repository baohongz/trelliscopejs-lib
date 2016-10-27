import React from 'react';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';

// needed for onTouchTap (can go away with react 1.0 release)
injectTapEventPlugin();

const App = () => (
  <div>
    <Header />
    <Body />
    <Footer />
  </div>
);

export default App;
