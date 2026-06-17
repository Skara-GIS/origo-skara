import defaultStyle from './stylefunctions/default';
import ritlagerStyle from './stylefunctions/ritlager';
import hatchYellowStyle from './stylefunctions/hatchyellow';
import hatchPinkStyle from './stylefunctions/hatchpink';
import hatchGreyStyle from './stylefunctions/hatchgrey';
import hatchDotBlueStyle from './stylefunctions/hatch_dot_blue';

const customStyles = {
  default: defaultStyle,
  ritlager: ritlagerStyle,
  hatchyellow: hatchYellowStyle,
  hatchpink: hatchPinkStyle,
  hatchgrey: hatchGreyStyle,
  hatchdotblue: hatchDotBlueStyle
};

export default function styleFunctions(customStyle, params) {
  if (customStyle in customStyles) {
    return customStyles[customStyle](params);
  }
  return customStyles.default(params);
}
