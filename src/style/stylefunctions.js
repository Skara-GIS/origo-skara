import defaultStyle from './stylefunctions/default';
import ritlagerStyle from './stylefunctions/ritlager';

const customStyles = {
  default: defaultStyle,
  ritlager: ritlagerStyle
};

export default function styleFunctions(customStyle, params) {
  if (customStyle in customStyles) {
    return customStyles[customStyle](params);
  }
  return customStyles.default(params);
}
