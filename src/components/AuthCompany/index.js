import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Steps,
  notification,
  Icon,
} from 'antd';
import cookie from '../../utils/cookie';

const { Step } = Steps;
const { TextArea } = Input;
@Form.create()
class AuthForm extends PureComponent {
  handleSubmit = e => {
    this.props.certificationState == 'success'
      ? this.props.onSubmit()
      : this.props.handleTakeInfo();
  };
  render() {
    const formItemLayout = {
      labelCol: {
        span: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };
    const { getFieldDecorator } = this.props.form;
    const { certificationState } = this.props;
    return (
      <Form
        style={{
          textAlign: 'center',
        }}
        layout="horizontal"
        hideRequiredMark
      >
        <div>
          <Icon
            type={
              certificationState == 'loading'
                ? 'sync'
                : certificationState == 'success'
                ? 'check-circle'
                : 'close-circle'
            }
            spin={certificationState == 'loading'}
            theme={certificationState != 'loading' ? 'twoTone' : ''}
            style={{
              fontSize: '50px',
              color: certificationState == 'loading' ? '#52c41a' : '',
            }}
            twoToneColor={certificationState == 'error' ? '#cf1010' : '#52c41a'}
          />
        </div>

        <p
          style={{
            fontSize: '24px',
            color: 'rgba(0, 0, 0, 0.85)',
            fontWeight: 500,
            lineHeight: '32px',
            margin: '16px 0',
          }}
        >
          {certificationState == 'loading'
            ? '认证检测中请稍后......'
            : certificationState == 'success'
            ? '认证成功'
            : '认证失败'}
        </p>

        {certificationState != 'loading' && (
          <Button
            onClick={this.handleSubmit}
            type={certificationState == 'success' ? 'primary' : 'default'}
          >
            {certificationState == 'success' ? '确认' : '重新获取认证信息'}
          </Button>
        )}
      </Form>
    );
  }
}

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      currStep: 0,
      certificationState: 'loading',
      market_info: this.props.market_info,
    };
  }

  componentWillMount() {
    this.handleMarket();
  }

  handleClose = () => {
    this.hidden();
    this.props.onOk && this.props.onOk();
  };
  hidden = () => {
    cookie.setGuide('appStore', 'true');
    this.props.dispatch({ type: 'global/hideAuthCompany' });
  };

  // 检测是否有market值
  handleMarket = () => {
    const market = this.state.market_info;
    if (market) {
      this.setState(
        {
          currStep: 1,
        },
        () => {
          this.handleAuthEnterprise(market);
        }
      );
    }
  };

  handleAuthEnterprise = market_info => {
    const { eid } = this.props;
    this.props.dispatch({
      type: 'global/authEnterprise',
      payload: {
        enterprise_id: eid,
        market_info,
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({
            certificationState: 'success',
          });
        }
      },
      handleError: res => {
        if (res && res.status === 500) {
          this.setState({
            certificationState: 'error',
          });
        }
      },
    });
  };

  handleTakeInfo = () => {
    const { rainbondInfo, eid } = this.props;
    const domain =
      rainbondInfo && rainbondInfo.market_url && rainbondInfo.market_url.enable
        ? rainbondInfo.market_url.value
        : 'https://market.goodrain.com';
    const callback = window.location.href;
    const version =
      rainbondInfo && rainbondInfo.version && rainbondInfo.version.enable
        ? rainbondInfo.version.value
        : '';
    const url = `${domain}/manage/jointcloud?join_id=${eid}&callback_url=${callback}&rbd_version=${version}`;
    window.location.href = url;
  };

  render() {
    const step = this.state.currStep;
    return (
      <Modal
        width={800}
        title="企业尚未绑定云端应用商店, 按以下步骤进行绑定认证"
        visible
        onCancel={this.hidden}
        footer={null}
      >
        <div>
          <Steps
            style={{
              margin: '0 auto',
              width: 'calc(100% - 80px)',
            }}
            progressDot
            current={step}
          >
            <Step title="获取认证信息" />
            <Step title="认证检测" />
          </Steps>
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              display: step === 0 ? 'block' : 'none',
            }}
          >
            <p>获取您企业的认证信息后返回本页进行第二步</p>
            <Button onClick={this.handleTakeInfo} type="primary">
              去获取
            </Button>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              width: '350px',
              margin: '0 auto',
              display: step === 1 ? 'block' : 'none',
            }}
          >
            <AuthForm
              onSubmit={this.handleClose}
              certificationState={this.state.certificationState}
              handleTakeInfo={this.handleTakeInfo}
            />
          </div>
        </div>
      </Modal>
    );
  }
}
