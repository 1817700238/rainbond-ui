import React, { PureComponent } from "react";
import { List,Form } from "antd";
import WaterWave from "../Charts/WaterWave";
import style from "./index.less";
import { log } from "util";

class InstanceList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      list: this.props.list,
    }
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.list!==this.props.list){
      this.setState({
        list:nextProps.list
      })
    }
  }
  componentDidMount() {}
  showName = (podName) => {
    const num = podName.split("-")[1];
    return `实例${num}`;
  };

  render() {
    const statusObj = {
      "Running":"正常运行",
      "Pending":"启动中",
      "Succeeded":"运行成功",
      "Failed":"运行失败",
      "Unknown":"未知",
    }
    return (
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={this.state.list}
        renderItem={item => (
          <List.Item className={style.item} key={item.pod_name}>
            <WaterWave
              className={style.instance}
              height={120}
              title="运行内存"
              percent={(item.container[0] && item.container[0].usage_rate) || 0}
            />
            <a className={style.instancename} href="javascript:;">
              {this.showName(item.pod_name)}
            </a>
            <br/>
            <a href="javascript:;" style={{color:"#000"}}>
              {statusObj[item.pod_status]}
            </a>
          </List.Item>
        )}
      />
    );
  }
}

export default InstanceList;
