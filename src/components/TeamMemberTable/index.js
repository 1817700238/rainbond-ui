import React, { PureComponent, Fragment } from 'react';
import moment from 'moment';
import { Table, Alert, Badge, Divider } from 'antd';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';

const statusMap = ['default', 'processing', 'success', 'error'];
class TeamMemberTable extends PureComponent {
  state = {
    selectedRowKeys: [],
    totalCallNo: 0
  };

  componentWillReceiveProps(nextProps) {}

  handleTableChange = (pagination, filters, sorter) => {
    this.props.onChange(pagination, filters, sorter);
  };

  render() {
    const {
      list,
      pagination,
      onDelete,
      onEditAction,
      onMoveTeam,
      team
    } = this.props;

    const columns = [
      {
        title: '用户名',
        dataIndex: 'user_name'
      },
      {
        title: '邮箱',
        dataIndex: 'email'
      },
      {
        title: '角色',
        dataIndex: 'role_info',
        render(val) {
          return (
            <span>
              {(val || []).map(item => {
                return (
                  <span style={{ marginRight: '8px' }} key={'role' + item.role_id}>
                    {roleUtil.actionMap(item.role_name)}
                  </span>
                );
              })}
            </span>
          );
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        render(val, data) {
          const roles = data.role_info || [];
          const creater = roles.filter(item => item.role_name === 'owner')[0];
          if (creater) {
            return null;
          }

          return (
            <div>
              {teamUtil.canDeleteMember(team) &&
                <a
                  href="javascript:;"
                  onClick={() => {
                    onDelete(data);
                  }}
                >
                  删除
                </a>}

              {teamUtil.canEditMemberRole(team) &&
                <a
                  style={{
                    marginLeft: 6
                  }}
                  onClick={() => {
                    onEditAction(data);
                  }}
                  href="javascript:;"
                >
                  修改角色
                </a>}

              {teamUtil.canChangeOwner(team) &&
                <a
                  style={{
                    marginLeft: 6
                  }}
                  onClick={() => {
                    onMoveTeam(data);
                  }}
                  href="javascript:;"
                >
                  移交团队
                </a>}
            </div>
          );
        }
      }
    ];

    return (
      <Table
        pagination={pagination}
        dataSource={list}
        columns={columns}
        onChange={this.handleTableChange}
      />
    );
  }
}

export default TeamMemberTable;
