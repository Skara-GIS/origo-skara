import defaultStyle from './stylefunctions/default';
import ritlagerStyle from './stylefunctions/ritlager';
import markStyle from './stylefunctions/mark';

const customStyles = {
  default: defaultStyle,
  ritlager: ritlagerStyle,
  mark: markStyle
};

export default function styleFunctions(customStyle, params) {
  if (customStyle in customStyles) {
    return customStyles[customStyle](params);
  }
  return customStyles.default(params);
}
