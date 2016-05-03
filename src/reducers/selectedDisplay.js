import { SELECT_DISPLAY } from '../constants.js';

const selectedDisplayReducer = (state = {
  name: '',
  group: ''
}, action) => {
  switch (action.type) {
    case SELECT_DISPLAY:
      return Object.assign({}, state, {
        name: action.name,
        group: action.group
      });
    default:
  }
  return state;
};

export default selectedDisplayReducer;