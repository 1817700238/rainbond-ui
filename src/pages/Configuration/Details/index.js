import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Form,
  Input,
  Card,
  Switch,
  Checkbox,
  Row,
  Col,
  Button,
  notification,
  Modal
} from 'antd';
import ConfigurationHeader from '../Header';
import Parameterinput from '@/components/Parameterinput';
import { createEnterprise, createTeam } from '@/utils/breadcrumb';
import { batchOperation } from '@/services/app';
import globalUtil from '@/utils/global';
import styles from './index.less';

const FormItem = Form.Item;
const { confirm } = Modal;

@connect(({ loading, teamControl, enterprise }) => ({
  AddConfigurationLoading: loading.effects['global/AddConfiguration'],
  EditConfigurationLoading: loading.effects['global/EditConfiguration'],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
@Form.create()
export default class ConfigurationDetails extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      info: {},
      loading: true,
      helpfulVisable: false
    };
  }
  componentDidMount() {
    this.loadComponents();
    this.loadConfigurationDetails();
  }
  onOk = (e) => {
    e.preventDefault();
    const { form } = this.props;
    const { id } = this.handleParameter();

    form.validateFields({ force: true }, (err, vals) => {
      if (!err) {
        if (vals.enable === undefined) {
          vals.enable = false;
        }
        if (
          vals.config_items &&
          vals.config_items.length === 1 &&
          vals.config_items[0].item_key === '' &&
          vals.config_items[0].item_value === ''
        ) {
          vals.config_items = [];
        }
        const parameter = Object.assign({}, vals, { deploy_type: 'env' });
        this.handleHelpfulVisable(parameter);
      }
    });
  };
  onCancel = () => {
    const { dispatch } = this.props;
    const { regionName, teamName, appID } = this.handleParameter();
    dispatch(
      routerRedux.push(
        `/team/${teamName}/region/${regionName}/apps/${appID}/configgroups`
      )
    );
  };
  handleConfiguration = (vals) => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID, id } = this.handleParameter();

    const parameter = {
      region_name: regionName,
      team_name: teamName,
      group_id: appID,
      ...vals
    };
    const { service_ids: serviceIds } = vals;
    if (`${id}` === 'add') {
      dispatch({
        type: 'global/AddConfiguration',
        payload: {
          ...parameter
        },
        callback: (res) => {
          if (res) {
            this.handleClose();
            notification.success({ message: '添加成功' });
            if (serviceIds && serviceIds.length > 0) {
              this.showRemind(serviceIds);
            } else {
              this.onCancel();
            }
          }
        }
      });
    } else {
      dispatch({
        type: 'global/EditConfiguration',
        payload: {
          name: id,
          ...parameter
        },
        callback: (res) => {
          if (res) {
            notification.success({ message: '保存成功' });
            this.handleClose();
            if (serviceIds && serviceIds.length > 0) {
              this.showRemind(serviceIds);
            } else {
              this.onCancel();
            }
          }
        }
      });
    }
  };

  showRemind = (serviceIds) => {
    const th = this;
    confirm({
      title: '需更新组件立即生效',
      content: '是否立即更新组件',
      okText: '更新',
      cancelText: '取消',
      onOk() {
        th.handleBatchOperation(serviceIds);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 2000);
        }).catch(() => console.log('Oops errors!'));
      },
      onCancel() {
        th.onCancel();
      }
    });
  };
  handleBatchOperation = (serviceIds) => {
    const { teamName } = this.handleParameter();
    batchOperation({
      action: 'upgrade',
      team_name: teamName,
      serviceIds: serviceIds && serviceIds.join(',')
    }).then((data) => {
      if (data) {
        notification.success({
          message: '更新成功',
          duration: '3'
        });
        this.onCancel();
      }
    });
  };

  loadComponents = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID, id } = this.handleParameter();
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID,
        page: 1,
        page_size: 999
      },
      callback: (res) => {
        if (res && res._code == 200) {
          this.setState({
            apps: res.list || []
          });
          if (id === 'add') {
            this.setState({
              loading: false
            });
          }
        }
      }
    });
  };

  loadConfigurationDetails = () => {
    const { dispatch } = this.props;
    const { teamName, appID, id } = this.handleParameter();
    if (id !== 'add') {
      dispatch({
        type: 'global/fetchConfigurationDetails',
        payload: {
          team_name: teamName,
          group_id: appID,
          name: id
        },
        callback: (res) => {
          if (res && res._code == 200) {
            this.setState({
              info: res.bean,
              loading: false
            });
          }
        }
      });
    }
  };

  checkConfiguration = (rule, value, callback) => {
    if (value && value.length > 0) {
      const arr = value.filter(
        (item) => item.item_key === '' || item.item_value === ''
      );
      if (value[0].item_key === '' && value[0].item_value === '') {
        callback();
      } else if (arr && arr.length > 0) {
        callback('配置项不能为空');
      } else {
        let judge = false;
        value.map((item) => {
          const { item_key } = item;
          if (!/^[-._a-zA-Z][-._a-zA-Z0-9]*$/.test(item_key)) {
            judge = true;
          }
        });
        if (judge) {
          callback(' 必须由字母、数字和 - . _ 组成，不支持数字开头');
          return;
        }

        callback();
      }
    }
    callback();
  };
  handleHelpfulVisable = (parameter) => {
    this.setState({ helpfulVisable: parameter });
  };
  handleClose = () => {
    this.setState({ helpfulVisable: false });
  };

  handleParameter = () => {
    const { match } = this.props;
    const { teamName, regionName, appID, id } = match.params;
    return {
      regionName,
      teamName,
      appID,
      id
    };
  };
  render() {
    const {
      form,
      AddConfigurationLoading,
      EditConfigurationLoading,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const { apps, info, loading, helpfulVisable } = this.state;
    const { getFieldDecorator } = form;
    const serviceIds = [];
    if (info && info.services && info.services.length > 0) {
      info.services.map((item) => {
        serviceIds.push(item.service_id);
      });
    }

    const { id } = this.handleParameter();
    const isCreate = id === 'add';
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );

    return (
      <ConfigurationHeader breadcrumbList={breadcrumbList}>
        {helpfulVisable && (
          <Modal
            visible
            title="友情提示"
            confirmLoading={AddConfigurationLoading || EditConfigurationLoading}
            onOk={() => {
              this.handleConfiguration(helpfulVisable);
            }}
            onCancel={this.handleClose}
          >
            <p>是否保存已修改的配置组</p>
          </Modal>
        )}
        <Card
          loading={loading}
          style={{ minHeight: '600px' }}
          title={isCreate ? '添加配置组' : '修改配置组'}
          extra={[
            <Button onClick={this.onCancel} style={{ marginRight: '20px' }}>
              取消
            </Button>,
            <Button
              type="primary"
              onClick={this.onOk}
              loading={AddConfigurationLoading || EditConfigurationLoading}
            >
              {isCreate ? '确定' : '保存'}
            </Button>
          ]}
        >
          <Form
            onSubmit={this.onOk}
            style={{ margin: '0 auto', width: '820px' }}
          >
            <Row style={{ display: 'flex', alignItems: 'center' }}>
              <FormItem style={{ width: '370px' }} label="配置组名称">
                {getFieldDecorator('config_group_name', {
                  initialValue: (info && info.config_group_name) || '',
                  rules: [
                    { required: true, message: '请填写配置组名称' },
                    {
                      min: 2,
                      message: '最小长度2位'
                    },
                    {
                      max: 64,
                      message: '最大长度64位'
                    },
                    {
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                      message:
                        '必须由小写的字母、数字和-组成，并且必须以字母数字开始和结束'
                    }
                  ]
                })(
                  <Input
                    style={{ width: '370px' }}
                    disabled={info && info.config_group_name}
                    placeholder="请填写配置组名称"
                  />
                )}
              </FormItem>
              <Form.Item
                style={{ width: '370px', marginLeft: '24px' }}
                label="生效状态"
              >
                {getFieldDecorator('enable', {
                  initialValue: info && info.enable,
                  rules: [{ required: false }]
                })(<Switch defaultChecked={info && info.enable} />)}
              </Form.Item>
            </Row>
            <FormItem label="配置项">
              {getFieldDecorator('config_items', {
                initialValue: (info && info.config_items) || [],
                rules: [
                  { required: false, message: '请填写配置项' },
                  {
                    validator: this.checkConfiguration
                  }
                ]
              })(
                <Parameterinput editInfo={(info && info.config_items) || ''} />
              )}
            </FormItem>
            <FormItem label="生效组件">
              {getFieldDecorator('service_ids', {
                initialValue: serviceIds,
                rules: [{ required: false, message: '请选择生效组件' }]
              })(
                <Checkbox.Group className={styles.setCheckbox}>
                  <Row span={24}>
                    {apps.map((item) => {
                      const {
                        service_cname: name,
                        service_id: serviceId
                      } = item;
                      return (
                        <Checkbox key={id} value={serviceId}>
                          {name}
                        </Checkbox>
                      );
                    })}
                  </Row>
                </Checkbox.Group>
              )}
            </FormItem>
          </Form>
        </Card>
      </ConfigurationHeader>
    );
  }
}
