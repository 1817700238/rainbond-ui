/* eslint-disable no-underscore-dangle */
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  notification,
  Row
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';

@connect()
@Form.create()
export default class SetRegionConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      configs: {},
      task: {}
    };
  }
  componentDidMount() {
    this.loadTask();
  }
  createClusters = () => {
    const { dispatch, eid, form, selectClusterID, selectProvider } = this.props;
    const { configsYaml, task } = this.state;
    let desc;
    switch (selectProvider) {
      case 'ack':
        desc = '从阿里云托管集群安装对接';
        break;
      case 'tke':
        desc = '从腾讯云托管集群安装对接';
        break;
      case 'custom':
        desc = '从自定义 Kubernetes 集群对接';
        break;
      case 'rke':
        desc = '提供主机安装 Kubernetes 集群并对接';
        break;
      default:
        desc = '自建集群';
    }
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({ commitloading: true });
      dispatch({
        type: 'region/createEnterpriseCluster',
        payload: {
          ...fieldsValue,
          enterprise_id: eid,
          desc,
          token: configsYaml,
          region_type: ['custom'],
          provider: selectProvider,
          providerClusterID: selectClusterID
        },
        callback: res => {
          if (res && res._condition === 200) {
            notification.success({ message: '添加成功' });
            dispatch({
              type: 'cloud/updateInitTaskStatus',
              payload: {
                enterprise_id: eid,
                taskID: task.taskID,
                status: 'complete'
              },
              callback: () => {
                dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
              },
              handleError: herr => {
                cloud.handleCloudAPIError(herr);
                this.setState({ commitloading: false });
              }
            });
          }
        },
        handleError: () => {
          this.setState({ commitloading: false });
        }
      });
    });
  };
  loadRegionConfig = () => {
    const { dispatch, eid, selectClusterID, selectProvider } = this.props;
    dispatch({
      type: 'cloud/loadRegionConfig',
      payload: {
        enterprise_id: eid,
        clusterID: selectClusterID,
        providerName: selectProvider
      },
      callback: data => {
        if (data) {
          this.setState({
            configs: data.configs,
            configsYaml: data.configs_yaml,
            loading: false
          });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  loadTask = () => {
    const { dispatch, eid, selectClusterID, selectProvider } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID: selectClusterID,
        providerName: selectProvider
      },
      callback: data => {
        if (data) {
          this.setState({ task: data });
          if (data.status === 'inited' || data.status === 'complete') {
            this.loadRegionConfig();
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };

  render() {
    const { selectProvider } = this.props;
    const { configs, loading, commitloading } = this.state;
    const { getFieldDecorator } = this.props.form;
    let clusterTitle;
    switch (selectProvider) {
      case 'ack':
        clusterTitle = '阿里云托管集群';
        break;
      case 'tke':
        clusterTitle = '腾讯云托管集群';
        break;
      case 'custom':
        clusterTitle = '自定义对接集群';
        break;
      case 'rke':
        clusterTitle = '自建集群';
        break;
      default:
        clusterTitle = '自建集群';
    }
    return (
      <Form>
        <Card loading={loading} bordered={false} style={{ padding: '0 16px' }}>
          <Row>
            <Descriptions>
              <Descriptions.Item label="API通信地址">
                {configs.apiAddress}
              </Descriptions.Item>
            </Descriptions>
          </Row>
          <Row style={{ marginTop: '32px' }}>
            <h4>集群设置</h4>
          </Row>
          <Row>
            <Col span={6} style={{ paddingRight: '16px' }}>
              <Form.Item label="集群ID">
                {getFieldDecorator('region_name', {
                  initialValue: '',
                  rules: [
                    {
                      required: true,
                      message: '请填写辨识度高的集群ID，不可修改'
                    },
                    {
                      pattern: /^[a-z0-9A-Z-_]+$/,
                      message: '只支持字母、数字和-_组合'
                    }
                  ]
                })(<Input placeholder="请填写辨识度高的集群ID，不可修改" />)}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="集群名称">
                {getFieldDecorator('region_alias', {
                  initialValue: clusterTitle,
                  rules: [{ required: true, message: '请填写集群名称!' }]
                })(<Input placeholder="请填写集群名称" />)}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
              <Button
                loading={commitloading}
                onClick={this.createClusters}
                type="primary"
              >
                对接
              </Button>
            </Col>
          </Row>
        </Card>
      </Form>
    );
  }
}
